import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Finding } from '../types.js';
import { listFiles } from '../utils/files.js';

export type GithubActionsStatus = 'pass' | 'warn' | 'fail';

export interface GithubActionsAudit {
  status: GithubActionsStatus;
  score: number;
  files: string[];
  findings: Finding[];
  nextActions: string[];
}

const WORKFLOW_DIR = '.github/workflows/';
const WORKFLOW_EXTENSIONS = new Set(['.yml', '.yaml']);
const FULL_SHA_PATTERN = /^[a-f0-9]{40}$/i;
const USES_PATTERN = /^\s*(?:-\s*)?uses:\s*([^@\s]+)(?:@([^\s#]+))?/gm;
const PERMISSIONS_PATTERN = /(^|\n)\s*permissions\s*:/i;
const WRITE_ALL_PATTERN = /(^|\n)\s*permissions:\s*write-all\b/i;
const WRITE_PERMISSION_PATTERN = /(^|\n)\s*(contents|pull-requests|issues|actions|checks|id-token|deployments|packages|repository-projects|statuses):\s*write\b/i;
const PULL_REQUEST_TARGET_PATTERN = /(^|\n)\s*pull_request_target\s*:/i;
const CHECKOUT_PATTERN = /^\s*-\s*uses:\s*actions\/checkout@/im;
const PR_HEAD_REF_PATTERN = /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/i;
const SECRET_PATTERN = /\bsecrets\.[A-Z0-9_]+\b/i;
const UNTRUSTED_CONTEXTS = [
  'github.event.issue.title',
  'github.event.issue.body',
  'github.event.pull_request.title',
  'github.event.pull_request.body',
  'github.event.pull_request.head.ref',
  'github.event.pull_request.head.label',
  'github.head_ref',
  'github.ref_name',
  'github.event.comment.body',
  'github.event.review_comment.body',
  'github.event.review.body',
  'github.event.discussion.title',
  'github.event.discussion.body',
  'github.event.inputs',
  'inputs.'
];

export async function auditGithubActions(options: { rootDir?: string } = {}): Promise<GithubActionsAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const workflowFiles = await listWorkflowFiles(rootDir);
  const findings: Finding[] = [];

  for (const filePath of workflowFiles) {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    const content = await fs.readFile(filePath, 'utf8');
    findings.push(...findActionsRisks(relativePath, content));
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 30 : finding.severity === 'medium' ? 12 : 5), 0);
  return {
    status: statusForFindings(uniqueFindings),
    score: Math.max(0, 100 - penalty),
    files: workflowFiles.map((filePath) => path.relative(rootDir, filePath).split(path.sep).join('/')),
    findings: uniqueFindings,
    nextActions: nextActions(uniqueFindings)
  };
}

export function formatGithubActionsAudit(audit: GithubActionsAudit): string {
  const lines = [
    `ContextForge GitHub Actions audit: ${audit.status}`,
    `Score: ${audit.score}/100`,
    `Workflow files: ${audit.files.join(', ') || 'none'}`,
    'Findings:',
    ...(audit.findings.length > 0 ? audit.findings.map((finding) => `- [${finding.severity}] ${finding.type}: ${finding.message}`) : ['- none']),
    'Next actions:',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createGithubActionsSummary(audit: GithubActionsAudit): string {
  const lines = [
    '# ContextForge GitHub Actions Audit',
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
      : ['| none | low |  | No GitHub Actions hardening findings. | Keep workflows pinned, least-privilege, and isolated from untrusted PR code. |']),
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

function findActionsRisks(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const hasPermissions = PERMISSIONS_PATTERN.test(content);
  const usesPullRequestTarget = PULL_REQUEST_TARGET_PATTERN.test(content);
  const hasWriteAll = WRITE_ALL_PATTERN.test(content);
  const hasWritePermissions = WRITE_PERMISSION_PATTERN.test(content) || hasWriteAll;
  const usesSecrets = SECRET_PATTERN.test(content);

  if (!hasPermissions) {
    findings.push({
      file,
      type: 'actions-missing-permissions',
      severity: 'medium',
      message: `${file} does not declare explicit workflow permissions.`,
      suggestion: 'Add least-privilege top-level permissions, usually `contents: read`, and grant write scopes only in isolated jobs that need them.'
    });
  }

  if (hasWriteAll) {
    findings.push({
      file,
      type: 'actions-write-all-permissions',
      severity: 'high',
      message: `${file} grants write-all permissions to the workflow token.`,
      suggestion: 'Replace `permissions: write-all` with explicit least-privilege scopes and isolate any write-capable job from untrusted input.'
    });
  }

  findings.push(...findUnpinnedActions(file, content));

  if (usesPullRequestTarget && CHECKOUT_PATTERN.test(content) && PR_HEAD_REF_PATTERN.test(content)) {
    findings.push({
      file,
      type: 'actions-pwn-request-checkout',
      severity: 'high',
      message: `${file} uses pull_request_target while checking out attacker-controlled PR head code.`,
      suggestion: 'Do not checkout or execute PR head code in pull_request_target workflows; split untrusted build and privileged reporting into separate workflows.'
    });
  } else if (usesPullRequestTarget) {
    findings.push({
      file,
      type: 'actions-pull-request-target',
      severity: hasWritePermissions || usesSecrets ? 'high' : 'medium',
      message: `${file} uses pull_request_target, which runs with base-repository context.`,
      suggestion: 'Keep pull_request_target workflows read-only and avoid secrets, write tokens, caches, or checkout of untrusted PR code.'
    });
  }

  const scriptContexts = findRunInterpolations(content);
  if (scriptContexts.length > 0) {
    findings.push({
      file,
      type: 'actions-script-injection',
      severity: usesPullRequestTarget || usesSecrets ? 'high' : 'medium',
      message: `${file} interpolates ${scriptContexts.join(', ')} directly into a run step.`,
      suggestion: 'Move untrusted GitHub contexts into environment variables or action inputs before shell use, and quote variables inside run scripts.'
    });
  }

  return findings;
}

function findUnpinnedActions(file: string, content: string): Finding[] {
  const findings: Finding[] = [];
  for (const match of content.matchAll(USES_PATTERN)) {
    const action = match[1];
    const ref = match[2] ?? '';
    if (action.startsWith('./') || action.startsWith('../') || action.startsWith('docker://')) continue;
    if (!ref || !FULL_SHA_PATTERN.test(ref)) {
      findings.push({
        file,
        type: 'actions-unpinned-action',
        severity: action.startsWith('actions/') || action.startsWith('github/') ? 'low' : 'medium',
        message: `${file} uses ${action}${ref ? `@${ref}` : ''} without a full commit SHA pin.`,
        suggestion: 'Pin third-party and marketplace actions to full commit SHAs, then update pins intentionally through dependency review.'
      });
    }
  }
  return findings;
}

function findRunInterpolations(content: string): string[] {
  const contexts = new Set<string>();
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const runMatch = line.match(/^(\s*)-\s*run:\s*(.*)$|^(\s*)run:\s*(.*)$/);
    if (!runMatch) continue;
    const indent = (runMatch[1] ?? runMatch[3] ?? '').length;
    const initial = runMatch[2] ?? runMatch[4] ?? '';
    const block = [initial];
    for (let inner = index + 1; inner < lines.length; inner += 1) {
      const nextLine = lines[inner];
      const nextIndent = nextLine.match(/^(\s*)/)?.[1].length ?? 0;
      if (nextLine.trim() !== '' && nextIndent <= indent) break;
      block.push(nextLine);
    }
    const text = block.join('\n');
    for (const context of UNTRUSTED_CONTEXTS) {
      if (text.includes(context)) contexts.add(context);
    }
  }
  return [...contexts].sort();
}

function statusForFindings(findings: Finding[]): GithubActionsStatus {
  if (findings.some((finding) => finding.severity === 'high')) return 'fail';
  if (findings.length > 0) return 'warn';
  return 'pass';
}

function nextActions(findings: Finding[]): string[] {
  if (findings.length === 0) return ['Keep GitHub Actions workflows pinned to full SHAs and least-privilege by default.'];
  const actions = ['Review every GitHub Actions hardening finding before trusting agent-authored or agent-triggered workflows.'];
  if (findings.some((finding) => finding.type === 'actions-unpinned-action')) actions.push('Pin actions to full commit SHAs and update them through review.');
  if (findings.some((finding) => finding.type === 'actions-pwn-request-checkout')) actions.push('Remove PR-head checkout from pull_request_target workflows.');
  if (findings.some((finding) => finding.type === 'actions-script-injection')) actions.push('Route untrusted GitHub contexts through env vars before shell use.');
  if (findings.some((finding) => finding.type.includes('permissions'))) actions.push('Declare least-privilege `permissions:` for every workflow.');
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
