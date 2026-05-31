import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Finding } from '../types.js';
import { listFiles } from '../utils/files.js';

export type McpExposureStatus = 'pass' | 'warn' | 'fail';

export interface McpExposureAudit {
  status: McpExposureStatus;
  score: number;
  files: string[];
  findings: Finding[];
  nextActions: string[];
}

interface McpServerConfig {
  command?: unknown;
  args?: unknown;
  env?: unknown;
}

const MCP_CONFIG_NAMES = new Set(['mcp.json', '.mcp.json']);
const MCP_CONFIG_SUFFIXES = ['.cursor/mcp.json', '.vscode/mcp.json', '.roo/mcp.json', '.kiro/mcp.json'];
const SECRET_KEY_PATTERN = /(token|secret|api[_-]?key|password|credential|private[_-]?key)/i;
const AUTO_APPROVAL_KEY_PATTERN = /(auto.?approve|always.?allow|skip.?confirm|skip.?approval|allow.?without.?ask|dangerously.?allow)/i;
const PERMISSION_KEY_PATTERN = /(allow|allowed|permission|tool|capabilit|scope)/i;
const BROAD_PERMISSION_VALUE_PATTERN = /(^\*$|write|delete|remove|exec|execute|shell|bash|terminal|filesystem:write|repo:write|pull_request:write|contents:write)/i;
const SECRET_VALUE_PATTERNS = [
  /^gh[pousr]_[A-Za-z0-9_]{10,}$/,
  /^sk-[A-Za-z0-9_-]{8,}/,
  /^xox[baprs]-[A-Za-z0-9-]{8,}/,
  /^[A-Za-z0-9_=-]{24,}$/
];

export async function auditMcpExposure(options: { rootDir?: string } = {}): Promise<McpExposureAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const files = await listMcpConfigFiles(rootDir);
  const findings: Finding[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
    } catch {
      findings.push({
        file: relativePath,
        type: 'invalid-mcp-json',
        severity: 'medium',
        message: `${relativePath} is not valid JSON, so MCP exposure could not be verified.`,
        suggestion: 'Fix the MCP config JSON or remove the file before agents load it.'
      });
      continue;
    }

    for (const [serverName, server] of Object.entries(readServers(parsed))) {
      findings.push(...findServerExposure(relativePath, serverName, server));
    }
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 30 : finding.severity === 'medium' ? 15 : 6), 0);
  const score = Math.max(0, 100 - penalty);
  return {
    status: statusForFindings(uniqueFindings),
    score,
    files: files.map((filePath) => path.relative(rootDir, filePath)),
    findings: uniqueFindings,
    nextActions: nextActions(uniqueFindings)
  };
}

export function formatMcpExposureAudit(audit: McpExposureAudit): string {
  const lines = [
    `ContextForge MCP exposure audit: ${audit.status}`,
    `Score: ${audit.score}/100`,
    `Config files: ${audit.files.join(', ') || 'none'}`,
    'Findings:',
    ...(audit.findings.length > 0
      ? audit.findings.map((finding) => `- [${finding.severity}] ${finding.type}: ${finding.message}`)
      : ['- none']),
    'Next actions:',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createMcpExposureSummary(audit: McpExposureAudit): string {
  const lines = [
    '# ContextForge MCP Exposure Audit',
    '',
    `Status: **${audit.status}**`,
    '',
    `Score: **${audit.score}/100**`,
    '',
    `Config files: ${audit.files.length > 0 ? audit.files.map((file) => `\`${file}\``).join(', ') : 'none'}`,
    '',
    '| Type | Severity | File | Message | Suggestion |',
    '| --- | --- | --- | --- | --- |',
    ...(audit.findings.length > 0
      ? audit.findings.map(
          (finding) =>
            `| ${escapeTableCell(finding.type)} | ${finding.severity} | ${escapeTableCell(finding.file ?? '')} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.suggestion)} |`
        )
      : ['| none | low |  | No MCP exposure findings. | Keep MCP configs reviewed before enabling new servers. |']),
    '',
    '## Next Actions',
    '',
    ...audit.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

async function listMcpConfigFiles(rootDir: string): Promise<string[]> {
  return listFiles(rootDir, (filePath) => {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    if (relativePath.startsWith('fixtures/')) return false;
    return MCP_CONFIG_NAMES.has(path.basename(filePath)) || MCP_CONFIG_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));
  });
}

function readServers(parsed: unknown): Record<string, McpServerConfig> {
  if (!isObject(parsed)) return {};
  const container = isObject(parsed.mcpServers) ? parsed.mcpServers : parsed;
  return Object.fromEntries(Object.entries(container).filter(([, value]) => isObject(value))) as Record<string, McpServerConfig>;
}

function findServerExposure(file: string, serverName: string, server: McpServerConfig): Finding[] {
  const findings: Finding[] = [];
  const command = typeof server.command === 'string' ? server.command : '';
  const args = Array.isArray(server.args) ? server.args.filter((arg): arg is string => typeof arg === 'string') : [];
  const env = isObject(server.env) ? server.env : {};
  const commandLine = [command, ...args].join(' ');

  for (const [key, value] of Object.entries(env)) {
    if (SECRET_KEY_PATTERN.test(key) && typeof value === 'string' && isHardcodedSecretValue(value)) {
      findings.push({
        file,
        type: 'hardcoded-secret',
        severity: 'high',
        message: `${file} server "${serverName}" hardcodes ${key} in MCP env.`,
        suggestion: 'Replace the literal value with an environment reference such as ${TOKEN_NAME} and rotate the exposed secret.'
      });
    }
  }

  if (/\bcurl\b[\s\S]*(\||>)\s*(bash|sh)\b/i.test(commandLine) || /\bwget\b[\s\S]*(\||>)\s*(bash|sh)\b/i.test(commandLine)) {
    findings.push({
      file,
      type: 'unsafe-shell',
      severity: 'high',
      message: `${file} server "${serverName}" pipes a remote script into a shell.`,
      suggestion: 'Pin and inspect MCP server packages instead of executing remote shell installers.'
    });
  }

  if (['npx', 'uvx', 'pipx'].includes(command) && args.some((arg) => isUnpinnedPackageArg(arg))) {
    findings.push({
      file,
      type: 'unpinned-package',
      severity: 'medium',
      message: `${file} server "${serverName}" launches an unpinned remote MCP package.`,
      suggestion: 'Pin MCP server packages to an explicit version before allowing coding agents to use them.'
    });
  }

  findings.push(...findPermissionExposure(file, serverName, server));

  return findings;
}

function findPermissionExposure(file: string, serverName: string, server: McpServerConfig): Finding[] {
  const findings: Finding[] = [];
  let reportedAutoApproval = false;
  let reportedBroadPermission = false;
  for (const [key, value] of walkConfigValues(server)) {
    if (!reportedAutoApproval && AUTO_APPROVAL_KEY_PATTERN.test(key) && isAutoApprovalValue(value)) {
      findings.push({
        file,
        type: 'mcp-auto-approval',
        severity: 'high',
        message: `${file} server "${serverName}" enables automatic MCP tool approval through ${key}.`,
        suggestion: 'Require explicit review for MCP tool calls before enabling this server for coding agents.'
      });
      reportedAutoApproval = true;
    }
    if (!reportedBroadPermission && PERMISSION_KEY_PATTERN.test(key) && hasBroadPermissionValue(value)) {
      findings.push({
        file,
        type: 'broad-tool-permission',
        severity: 'medium',
        message: `${file} server "${serverName}" grants broad MCP tool permissions through ${key}.`,
        suggestion: 'Limit MCP permissions to the smallest read-only tool set needed for the repository.'
      });
      reportedBroadPermission = true;
    }
  }
  return findings;
}

function walkConfigValues(value: unknown, key = ''): Array<[string, unknown]> {
  if (Array.isArray(value)) {
    return [[key, value], ...value.flatMap((item, index) => walkConfigValues(item, `${key}[${index}]`))];
  }
  if (!isObject(value)) return [[key, value]];
  return Object.entries(value).flatMap(([childKey, childValue]) => {
    const fullKey = key ? `${key}.${childKey}` : childKey;
    return [[fullKey, childValue] as [string, unknown], ...walkConfigValues(childValue, fullKey)];
  });
}

function isHardcodedSecretValue(value: string): boolean {
  if (/^\$\{?[A-Z0-9_]+\}?$/.test(value)) return false;
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function isAutoApprovalValue(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') return /^(true|yes|always|all|\*)$/i.test(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function hasBroadPermissionValue(value: unknown): boolean {
  if (typeof value === 'string') return BROAD_PERMISSION_VALUE_PATTERN.test(value);
  if (Array.isArray(value)) return value.some((item) => hasBroadPermissionValue(item));
  if (isObject(value)) return Object.values(value).some((item) => hasBroadPermissionValue(item));
  return false;
}

function isUnpinnedPackageArg(arg: string): boolean {
  if (arg.startsWith('-')) return false;
  if (arg.startsWith('@')) {
    const withoutScope = arg.slice(1);
    return !withoutScope.includes('@');
  }
  return !arg.includes('@') && /^[a-z0-9@/_-]+$/i.test(arg);
}

function statusForFindings(findings: Finding[]): McpExposureStatus {
  if (findings.some((finding) => finding.severity === 'high')) return 'fail';
  if (findings.length > 0) return 'warn';
  return 'pass';
}

function nextActions(findings: Finding[]): string[] {
  const actions: string[] = [];
  if (findings.some((finding) => finding.type === 'hardcoded-secret')) {
    actions.push('Move MCP credentials to environment variables or a secret manager, then rotate any exposed tokens.');
  }
  if (findings.some((finding) => finding.type === 'unsafe-shell')) {
    actions.push('Remove remote shell installers from MCP configs and use pinned packages or reviewed local commands.');
  }
  if (findings.some((finding) => finding.type === 'unpinned-package')) {
    actions.push('Pin MCP server package versions before enabling them for Codex, Claude, or other coding agents.');
  }
  if (findings.some((finding) => finding.type === 'mcp-auto-approval')) {
    actions.push('Disable automatic MCP tool approval unless the server is pinned, reviewed, and least-privileged.');
  }
  if (findings.some((finding) => finding.type === 'broad-tool-permission')) {
    actions.push('Reduce MCP tool permissions to explicit read-only capabilities before sharing the repo with coding agents.');
  }
  if (actions.length === 0) actions.push('Review new MCP servers before committing config changes.');
  return actions;
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}
