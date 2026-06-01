import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { agentSurfaceInventoryItemsForPath } from './agentSurfaceInventory.js';

const execFileAsync = promisify(execFile);

export type AgentSurfaceDiffStatus = 'A' | 'M' | 'D' | 'R' | 'T' | 'U' | 'X' | 'B';
export type AgentSurfaceDiffAction = 'added' | 'modified' | 'deleted' | 'renamed' | 'type-changed' | 'unmerged' | 'unknown';

export interface AgentSurfaceDiffInputChange {
  status: string;
  path: string;
  previousPath?: string;
}

export interface AgentSurfaceDiffChange {
  path: string;
  previousPath?: string;
  action: AgentSurfaceDiffAction;
  ecosystem: string;
  coverage: string[];
  whyItMatters: string;
}

export interface AgentSurfaceDiff {
  baseRef: string;
  totalChangedSurfaces: number;
  affectedEcosystems: string[];
  changes: AgentSurfaceDiffChange[];
  ignoredFiles: string[];
}

export function createAgentSurfaceDiff(options: { baseRef?: string; changes: AgentSurfaceDiffInputChange[] }): AgentSurfaceDiff {
  const baseRef = options.baseRef ?? 'main';
  const changes: AgentSurfaceDiffChange[] = [];
  const ignoredFiles: string[] = [];

  for (const input of options.changes) {
    const surfacePath = surfaceLookupPath(input);
    const surfaces = agentSurfaceInventoryItemsForPath(surfacePath);
    if (surfaces.length === 0) {
      ignoredFiles.push(input.path);
      continue;
    }
    for (const surface of surfaces) {
      changes.push({
        path: input.path,
        previousPath: input.previousPath,
        action: actionForStatus(input.status),
        ecosystem: surface.ecosystem,
        coverage: surface.coverage,
        whyItMatters: surface.whyItMatters
      });
    }
  }

  changes.sort((left, right) => left.path.localeCompare(right.path) || left.ecosystem.localeCompare(right.ecosystem));
  ignoredFiles.sort();

  return {
    baseRef,
    totalChangedSurfaces: new Set(changes.map((change) => `${change.previousPath ?? ''}->${change.path}`)).size,
    affectedEcosystems: [...new Set(changes.map((change) => change.ecosystem))].sort(),
    changes,
    ignoredFiles
  };
}

export function createAgentSurfaceDiffMarkdown(diff: AgentSurfaceDiff): string {
  const lines = [
    '# ContextForge Agent Surface Diff',
    '',
    `Compared against **${diff.baseRef}** and detected **${diff.totalChangedSurfaces}** changed agent-readable surface${
      diff.totalChangedSurfaces === 1 ? '' : 's'
    }.`,
    '',
    '## Affected Ecosystems',
    '',
    diff.affectedEcosystems.length > 0 ? diff.affectedEcosystems.map((ecosystem) => `- ${ecosystem}`).join('\n') : '- none',
    '',
    '## Changed Agent Surfaces',
    '',
    '| File | Action | Ecosystem | Follow-up checks | Why it matters |',
    '| --- | --- | --- | --- | --- |',
    ...(diff.changes.length > 0
      ? diff.changes.map(
          (change) =>
            `| ${formatChangedPath(change)} | ${change.action} | ${change.ecosystem} | ${change.coverage.map(formatCode).join(', ')} | ${escapeTableCell(change.whyItMatters)} |`
        )
      : ['| none | none | none | `contextforge doctor` | No changed agent-readable PR surfaces were detected. |']),
    '',
    '## Suggested Proof Commands',
    '',
    '```bash',
    `contextforge surface-diff --base ${diff.baseRef} --output contextforge-agent-surface-diff.md`,
    'contextforge security-audit --min-security-score 80',
    'contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif',
    'contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif',
    '```',
    ''
  ];
  return `${lines.join('\n')}\n`;
}

export async function collectAgentSurfaceDiffChanges(baseRef: string, cwd: string = process.cwd()): Promise<AgentSurfaceDiffInputChange[]> {
  const changes = new Map<string, AgentSurfaceDiffInputChange>();
  await addNameStatusChanges(changes, ['diff', '--name-status', '--diff-filter=ACMRTD', `${baseRef}...HEAD`], cwd);
  await addNameStatusChanges(changes, ['diff', '--name-status', '--diff-filter=ACMRTD'], cwd);
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '--others', '--exclude-standard'], { cwd });
    for (const file of stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)) {
      changes.set(`A:${file}`, { status: 'A', path: normalizePath(file) });
    }
  } catch {
    // Keep the command usable in non-git directories.
  }
  return [...changes.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function addNameStatusChanges(changes: Map<string, AgentSurfaceDiffInputChange>, args: string[], cwd: string): Promise<void> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd });
    for (const line of stdout.split('\n').map((item) => item.trim()).filter(Boolean)) {
      const parsed = parseNameStatusLine(line);
      if (parsed) changes.set(`${parsed.status}:${parsed.previousPath ?? ''}:${parsed.path}`, parsed);
    }
  } catch {
    // Shallow clones, empty repositories, and non-git directories should still produce a readable empty diff.
  }
}

function parseNameStatusLine(line: string): AgentSurfaceDiffInputChange | undefined {
  const parts = line.split('\t').filter(Boolean);
  if (parts.length < 2) return undefined;
  const status = parts[0][0] ?? 'X';
  if (status === 'R' && parts.length >= 3) {
    return { status: 'R', previousPath: normalizePath(parts[1]), path: normalizePath(parts[2]) };
  }
  return { status, path: normalizePath(parts[1]) };
}

function surfaceLookupPath(change: AgentSurfaceDiffInputChange): string {
  const currentSurfaces = agentSurfaceInventoryItemsForPath(change.path);
  if (currentSurfaces.length > 0) return change.path;
  return change.previousPath ?? change.path;
}

function actionForStatus(status: string): AgentSurfaceDiffAction {
  const normalized = status[0] ?? 'X';
  if (normalized === 'A') return 'added';
  if (normalized === 'M') return 'modified';
  if (normalized === 'D') return 'deleted';
  if (normalized === 'R') return 'renamed';
  if (normalized === 'T') return 'type-changed';
  if (normalized === 'U') return 'unmerged';
  return 'unknown';
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function formatChangedPath(change: AgentSurfaceDiffChange): string {
  if (change.previousPath) return `${formatCode(change.previousPath)} -> ${formatCode(change.path)}`;
  return formatCode(change.path);
}

function formatCode(value: string): string {
  return `\`${value.replace(/`/g, '\\`')}\``;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
