import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Finding } from '../types.js';
import { listFiles } from '../utils/files.js';

export type ClaudeSettingsStatus = 'pass' | 'warn' | 'fail';

export interface ClaudeSettingsAudit {
  status: ClaudeSettingsStatus;
  score: number;
  files: string[];
  findings: Finding[];
  nextActions: string[];
}

const CLAUDE_SETTINGS_NAMES = new Set(['settings.json', 'settings.local.json']);
const RISKY_DEFAULT_MODES = new Set(['bypassPermissions', 'dontAsk']);
const REQUIRED_SENSITIVE_DENY_PATTERNS = [/Read\(\.\/\.env\)/i, /Read\(\.\/\.env\.\*/i, /Read\(\.\/secrets\//i];

export async function auditClaudeSettings(options: { rootDir?: string } = {}): Promise<ClaudeSettingsAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const files = await listClaudeSettingsFiles(rootDir);
  const findings: Finding[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
    } catch {
      findings.push({
        file: relativePath,
        type: 'invalid-claude-settings-json',
        severity: 'medium',
        message: `${relativePath} is not valid JSON, so Claude Code settings could not be verified.`,
        suggestion: 'Fix the Claude Code settings JSON before sharing the repository with Claude Code users.'
      });
      continue;
    }
    findings.push(...findClaudeSettingsRisks(relativePath, parsed));
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 30 : finding.severity === 'medium' ? 15 : 6), 0);
  const score = Math.max(0, 100 - penalty);
  return {
    status: statusForFindings(uniqueFindings),
    score,
    files: files.map((filePath) => path.relative(rootDir, filePath).split(path.sep).join('/')),
    findings: uniqueFindings,
    nextActions: nextActions(uniqueFindings)
  };
}

export function formatClaudeSettingsAudit(audit: ClaudeSettingsAudit): string {
  const lines = [
    `ContextForge Claude settings audit: ${audit.status}`,
    `Score: ${audit.score}/100`,
    `Settings files: ${audit.files.join(', ') || 'none'}`,
    'Findings:',
    ...(audit.findings.length > 0
      ? audit.findings.map((finding) => `- [${finding.severity}] ${finding.type}: ${finding.message}`)
      : ['- none']),
    'Next actions:',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createClaudeSettingsSummary(audit: ClaudeSettingsAudit): string {
  const lines = [
    '# ContextForge Claude Code Settings Audit',
    '',
    `Status: **${audit.status}**`,
    '',
    `Score: **${audit.score}/100**`,
    '',
    `Settings files: ${audit.files.length > 0 ? audit.files.map((file) => `\`${file}\``).join(', ') : 'none'}`,
    '',
    '| Type | Severity | File | Message | Suggestion |',
    '| --- | --- | --- | --- | --- |',
    ...(audit.findings.length > 0
      ? audit.findings.map(
          (finding) =>
            `| ${escapeTableCell(finding.type)} | ${finding.severity} | ${escapeTableCell(finding.file ?? '')} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.suggestion)} |`
        )
      : ['| none | low |  | No Claude Code settings findings. | Keep project settings least-privileged and review hooks before sharing the repo. |']),
    '',
    '## Next Actions',
    '',
    ...audit.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

async function listClaudeSettingsFiles(rootDir: string): Promise<string[]> {
  return listFiles(rootDir, (filePath) => {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    if (relativePath.startsWith('fixtures/')) return false;
    const parts = relativePath.split('/');
    return parts.length === 2 && parts[0] === '.claude' && CLAUDE_SETTINGS_NAMES.has(parts[1]);
  });
}

function findClaudeSettingsRisks(file: string, parsed: unknown): Finding[] {
  if (!isObject(parsed)) {
    return [
      {
        file,
        type: 'invalid-claude-settings-json',
        severity: 'medium',
        message: `${file} does not contain a JSON object.`,
        suggestion: 'Replace the file with a valid Claude Code settings object.'
      }
    ];
  }
  const findings: Finding[] = [];
  const defaultMode = typeof parsed.defaultMode === 'string' ? parsed.defaultMode : '';
  const permissions = isObject(parsed.permissions) ? parsed.permissions : {};
  const allowRules = readStringArray(permissions.allow);
  const denyRules = readStringArray(permissions.deny);

  if (RISKY_DEFAULT_MODES.has(defaultMode)) {
    findings.push({
      file,
      type: 'claude-bypass-mode',
      severity: 'high',
      message: `${file} sets defaultMode to ${defaultMode}, reducing Claude Code permission prompts for future sessions.`,
      suggestion: 'Use default or plan mode in project settings and keep bypass permissions as an explicit per-session human choice.'
    });
  }

  if (defaultMode && readDisableBypassPermissionsMode(parsed, permissions) !== 'disable') {
    findings.push({
      file,
      type: 'claude-bypass-not-disabled',
      severity: 'medium',
      message: `${file} does not disable Claude Code bypass permissions mode.`,
      suggestion: 'Set disableBypassPermissionsMode to "disable" in shared or managed settings when the repo should not allow dangerous skip-permission mode.'
    });
  }

  if (allowRules.some(isBroadBashAllow)) {
    findings.push({
      file,
      type: 'claude-broad-bash-permission',
      severity: 'high',
      message: `${file} allows broad Claude Code Bash execution through permissions.allow.`,
      suggestion: 'Replace broad Bash allow rules with specific commands such as Bash(git status:*) or Bash(pnpm test:*).'
    });
  }

  if (findHookCommands(parsed.hooks).some(isRemoteShellCommand)) {
    findings.push({
      file,
      type: 'claude-remote-shell-hook',
      severity: 'high',
      message: `${file} defines a Claude Code hook that pipes a remote script into a shell.`,
      suggestion: 'Use reviewed local hook scripts or pinned packages instead of curl/wget-to-shell hooks.'
    });
  }

  if (readStringArray(parsed.allowedHttpHookUrls).some((value) => value.trim() === '*' || /^https?:\/\/\*/i.test(value.trim()))) {
    findings.push({
      file,
      type: 'claude-broad-http-hook-allowlist',
      severity: 'medium',
      message: `${file} allows Claude Code HTTP hooks to target broad URL patterns.`,
      suggestion: 'Restrict allowedHttpHookUrls to reviewed HTTPS hook hosts instead of wildcard destinations.'
    });
  }

  if (!hasSensitiveReadDeny(denyRules)) {
    findings.push({
      file,
      type: 'claude-missing-sensitive-deny',
      severity: 'medium',
      message: `${file} does not deny reads of common sensitive files such as .env or secrets directories.`,
      suggestion: 'Add permissions.deny entries like Read(./.env), Read(./.env.*), and Read(./secrets/**).'
    });
  }

  return findings;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isBroadBashAllow(rule: string): boolean {
  const value = rule.replace(/\s+/g, '');
  return /^Bash\((\*|\*:.*|.*;\*|.*&&.*|.*\|\|.*)\)$/i.test(value) || /^Bash\((curl|wget|bash|sh|rm|sudo|chmod|chown).*?\*?\)$/i.test(value);
}

function findHookCommands(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(findHookCommands);
  if (!isObject(value)) return [];
  const commands: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (key === 'command' && typeof child === 'string') commands.push(child);
    commands.push(...findHookCommands(child));
  }
  return commands;
}

function isRemoteShellCommand(command: string): boolean {
  return /\bcurl\b[\s\S]*(\||>)\s*(bash|sh)\b/i.test(command) || /\bwget\b[\s\S]*(\||>)\s*(bash|sh)\b/i.test(command);
}

function readDisableBypassPermissionsMode(parsed: Record<string, unknown>, permissions: Record<string, unknown>): string {
  if (parsed.disableBypassPermissionsMode === 'disable') return 'disable';
  return permissions.disableBypassPermissionsMode === 'disable' ? 'disable' : '';
}

function hasSensitiveReadDeny(denyRules: string[]): boolean {
  return REQUIRED_SENSITIVE_DENY_PATTERNS.every((pattern) => denyRules.some((rule) => pattern.test(rule)));
}

function statusForFindings(findings: Finding[]): ClaudeSettingsStatus {
  if (findings.some((finding) => finding.severity === 'high')) return 'fail';
  if (findings.length > 0) return 'warn';
  return 'pass';
}

function nextActions(findings: Finding[]): string[] {
  if (findings.length === 0) return ['Keep Claude Code project settings reviewed before sharing new hooks or permission rules.'];
  const actions = new Set<string>();
  for (const finding of findings) {
    if (finding.type.includes('bypass')) actions.add('Keep Claude Code bypass permissions disabled in shared project settings.');
    if (finding.type.includes('bash') || finding.type.includes('hook')) actions.add('Replace broad command permissions and remote shell hooks with reviewed, specific commands.');
    if (finding.type.includes('sensitive')) actions.add('Deny reads of .env files, secrets directories, and credential files in shared Claude Code settings.');
  }
  return [...actions];
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.type}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
