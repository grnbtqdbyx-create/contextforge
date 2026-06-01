import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Finding } from '../types.js';
import { listFiles } from '../utils/files.js';

export type AgenticWorkflowStatus = 'pass' | 'warn' | 'fail';

export interface AgenticWorkflowAudit {
  status: AgenticWorkflowStatus;
  score: number;
  files: string[];
  findings: Finding[];
  nextActions: string[];
}

const WORKFLOW_DIR = '.github/workflows/';
const WORKFLOW_EXTENSIONS = new Set(['.yml', '.yaml']);
const AGENT_INVOCATION_PATTERN = /\b(codex|claude|anthropic|openai|copilot|aider|opencode|cursor|llm|agent)\b/i;
const UNTRUSTED_EVENT_CONTEXTS = [
  'github.event.issue.body',
  'github.event.pull_request.body',
  'github.event.comment.body',
  'github.event.review.body',
  'github.event.discussion.body',
  'github.event.inputs'
];
const WRITE_PERMISSION_PATTERN = /(^|\n)\s*(contents|pull-requests|issues|actions|checks|id-token|deployments|packages|repository-projects|statuses):\s*write\b/i;
const PULL_REQUEST_TARGET_PATTERN = /(^|\n)\s*pull_request_target\s*:/i;
const SECRET_PATTERN = /\bsecrets\.[A-Z0-9_]+\b/i;

export async function auditAgenticWorkflows(options: { rootDir?: string } = {}): Promise<AgenticWorkflowAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const workflowFiles = await listWorkflowFiles(rootDir);
  const findings: Finding[] = [];

  for (const filePath of workflowFiles) {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    const content = await fs.readFile(filePath, 'utf8');
    findings.push(...findWorkflowRisks(relativePath, content));
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 30 : finding.severity === 'medium' ? 15 : 6), 0);
  return {
    status: statusForFindings(uniqueFindings),
    score: Math.max(0, 100 - penalty),
    files: workflowFiles.map((filePath) => path.relative(rootDir, filePath).split(path.sep).join('/')),
    findings: uniqueFindings,
    nextActions: nextActions(uniqueFindings)
  };
}

export function formatAgenticWorkflowAudit(audit: AgenticWorkflowAudit): string {
  const lines = [
    `ContextForge agentic workflow audit: ${audit.status}`,
    `Score: ${audit.score}/100`,
    `Workflow files: ${audit.files.join(', ') || 'none'}`,
    'Findings:',
    ...(audit.findings.length > 0
      ? audit.findings.map((finding) => `- [${finding.severity}] ${finding.type}: ${finding.message}`)
      : ['- none']),
    'Next actions:',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createAgenticWorkflowSummary(audit: AgenticWorkflowAudit): string {
  const lines = [
    '# ContextForge Agentic Workflow Audit',
    '',
    `Status: **${audit.status}**`,
    '',
    `Score: **${audit.score}/100**`,
    '',
    `Workflow files: ${audit.files.length > 0 ? audit.files.map((file) => `\`${file}\``).join(', ') : 'none'}`,
    '',
    '| Type | Severity | File | Message | Suggestion |',
    '| --- | --- | --- | --- | --- |',
    ...(audit.findings.length > 0
      ? audit.findings.map(
          (finding) =>
            `| ${escapeTableCell(finding.type)} | ${finding.severity} | ${escapeTableCell(finding.file ?? '')} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.suggestion)} |`
        )
      : ['| none | low |  | No agentic workflow findings. | Keep untrusted issue, PR, review, and comment text out of privileged agent prompts. |']),
    '',
    '## Next Actions',
    '',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

async function listWorkflowFiles(rootDir: string): Promise<string[]> {
  return listFiles(rootDir, (filePath) => {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    return relativePath.startsWith(WORKFLOW_DIR) && WORKFLOW_EXTENSIONS.has(path.extname(filePath));
  });
}

function findWorkflowRisks(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const hasAgentInvocation = AGENT_INVOCATION_PATTERN.test(content);
  const untrustedContexts = UNTRUSTED_EVENT_CONTEXTS.filter((context) => content.includes(context));
  const hasWritePermissions = WRITE_PERMISSION_PATTERN.test(content);
  const usesPullRequestTarget = PULL_REQUEST_TARGET_PATTERN.test(content);
  const usesSecrets = SECRET_PATTERN.test(content);

  if (hasAgentInvocation && untrustedContexts.length > 0) {
    findings.push({
      file,
      type: 'agentic-untrusted-event-context',
      severity: usesPullRequestTarget || hasWritePermissions || usesSecrets ? 'high' : 'medium',
      message: `${file} feeds ${untrustedContexts.join(', ')} into an agentic command or action.`,
      suggestion: 'Treat issue, PR, review, and comment text as untrusted data; summarize or sanitize it before passing it to Codex, Claude, Copilot, or other agents.'
    });
  }

  if (hasAgentInvocation && (usesPullRequestTarget || hasWritePermissions)) {
    findings.push({
      file,
      type: 'agentic-write-permissions',
      severity: usesPullRequestTarget ? 'high' : 'medium',
      message: `${file} runs an agentic workflow with ${usesPullRequestTarget ? 'pull_request_target' : 'write permissions'} available.`,
      suggestion: 'Prefer pull_request with read-only permissions for agent review, or isolate privileged write steps from any model-generated output.'
    });
  }

  if (hasAgentInvocation && usesSecrets && untrustedContexts.length > 0) {
    findings.push({
      file,
      type: 'agentic-secret-exposure',
      severity: 'high',
      message: `${file} combines repository secrets with untrusted GitHub event text in an agentic workflow.`,
      suggestion: 'Do not expose secrets to jobs that pass untrusted event text into an agent; split the workflow or require maintainer approval before secrets are available.'
    });
  }

  return findings;
}

function statusForFindings(findings: Finding[]): AgenticWorkflowStatus {
  if (findings.some((finding) => finding.severity === 'high')) return 'fail';
  if (findings.length > 0) return 'warn';
  return 'pass';
}

function nextActions(findings: Finding[]): string[] {
  if (findings.length === 0) return ['Keep agentic workflows read-only unless a maintainer explicitly approves privileged follow-up steps.'];
  const actions = ['Review every workflow finding before letting coding agents consume GitHub issue, PR, review, or comment text.'];
  if (findings.some((finding) => finding.type === 'agentic-untrusted-event-context')) {
    actions.push('Sanitize or summarize untrusted GitHub event text before passing it to an agent prompt.');
  }
  if (findings.some((finding) => finding.type === 'agentic-write-permissions')) {
    actions.push('Separate read-only agent review from write-capable repository mutation steps.');
  }
  if (findings.some((finding) => finding.type === 'agentic-secret-exposure')) {
    actions.push('Move secrets behind environment approval or remove them from jobs that ingest untrusted event text.');
  }
  return actions;
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file ?? ''}|${finding.type}|${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}
