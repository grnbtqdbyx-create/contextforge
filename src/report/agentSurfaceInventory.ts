import path from 'node:path';
import { isAdjacentAgentRulePath, isCopilotHookConfigPath, isCopilotInstructionPath, isCopilotWorkspaceSettingsPath } from '../utils/contextFiles.js';
import { listFiles } from '../utils/files.js';

export interface AgentSurfaceInventoryItem {
  path: string;
  ecosystem: string;
  coverage: string[];
  whyItMatters: string;
}

export interface AgentSurfaceInventoryGroup {
  ecosystem: string;
  count: number;
  files: string[];
}

export interface AgentSurfaceInventory {
  rootDir: string;
  totalFiles: number;
  groups: AgentSurfaceInventoryGroup[];
  surfaces: AgentSurfaceInventoryItem[];
}

interface SurfaceDefinition {
  ecosystem: string;
  coverage: string[];
  whyItMatters: string;
  matches: (relativePath: string) => boolean;
}

const surfaceDefinitions: SurfaceDefinition[] = [
  {
    ecosystem: 'OpenAI Codex',
    coverage: ['contextforge agents-md-audit', 'contextforge security-audit', 'contextforge pack'],
    whyItMatters: 'Codex-compatible repo instructions steer long-running coding tasks.',
    matches: (relativePath) => path.basename(relativePath) === 'AGENTS.md'
  },
  {
    ecosystem: 'Claude Code',
    coverage: ['contextforge claude-audit', 'contextforge security-audit', 'contextforge pack'],
    whyItMatters: 'Claude project memory, settings, skills, subagents, and commands can change tool behavior and permissions.',
    matches: (relativePath) =>
      path.basename(relativePath) === 'CLAUDE.md' ||
      /^\.claude\/settings.*\.json$/i.test(relativePath) ||
      /^\.claude\/skills\/[^/]+\/SKILL\.md$/i.test(relativePath) ||
      /^\.claude\/agents\/.+\.md$/i.test(relativePath) ||
      /^\.claude\/commands\/.+\.md$/i.test(relativePath)
  },
  {
    ecosystem: 'GitHub Copilot',
    coverage: ['contextforge security-audit', 'contextforge agents-md-audit', 'contextforge pack'],
    whyItMatters: 'Copilot custom instructions, prompts, custom agents, hooks, and workspace settings affect review and coding behavior.',
    matches: (relativePath) =>
      isCopilotInstructionPath(relativePath) ||
      /^\.github\/prompts\/.+\.prompt\.md$/i.test(relativePath) ||
      /^\.github\/agents\/.+(\.agent)?\.md$/i.test(relativePath) ||
      /^\.github\/skills\/[^/]+\/SKILL\.md$/i.test(relativePath) ||
      isCopilotHookConfigPath(relativePath) ||
      isCopilotWorkspaceSettingsPath(relativePath)
  },
  {
    ecosystem: 'MCP tool configs',
    coverage: ['contextforge mcp-audit', 'contextforge security-audit'],
    whyItMatters: 'MCP configs expose tools to agents and can hide unsafe shell, unpinned packages, broad permissions, or secrets.',
    matches: (relativePath) =>
      ['mcp.json', '.mcp.json'].includes(path.basename(relativePath)) ||
      ['.cursor/mcp.json', '.vscode/mcp.json', '.roo/mcp.json', '.kiro/mcp.json'].some((suffix) => relativePath.endsWith(suffix))
  },
  {
    ecosystem: 'Adjacent agent rules',
    coverage: ['contextforge security-audit', 'contextforge pack'],
    whyItMatters: 'Cursor, Cline, Gemini CLI, and Windsurf rules are repo-local instructions that agents may load before acting.',
    matches: (relativePath) =>
      isAdjacentAgentRulePath(relativePath) || ['GEMINI.md', '.cursorrules', '.clinerules', '.windsurfrules'].includes(path.basename(relativePath))
  },
  {
    ecosystem: 'Repository entrypoints',
    coverage: ['contextforge security-audit', 'contextforge pack'],
    whyItMatters: 'README files are commonly read by agents and can become instruction-injection surfaces.',
    matches: (relativePath) => path.basename(relativePath) === 'README.md'
  }
];

export async function createAgentSurfaceInventory(options: { rootDir?: string } = {}): Promise<AgentSurfaceInventory> {
  const rootDir = options.rootDir ?? process.cwd();
  const files = await listFiles(rootDir);
  const surfaces = files
    .map((filePath) => path.relative(rootDir, filePath).split(path.sep).join('/'))
    .filter((relativePath) => !isInventoryIgnored(relativePath))
    .flatMap((relativePath) => inventoryItemForPath(relativePath))
    .sort((left, right) => left.path.localeCompare(right.path) || left.ecosystem.localeCompare(right.ecosystem));

  return {
    rootDir,
    totalFiles: new Set(surfaces.map((surface) => surface.path)).size,
    groups: groupSurfaces(surfaces),
    surfaces
  };
}

export function createAgentSurfaceInventoryMarkdown(inventory: AgentSurfaceInventory): string {
  const lines = [
    '# ContextForge Agent Surface Inventory',
    '',
    `Detected **${inventory.totalFiles}** agent-readable repo surface${inventory.totalFiles === 1 ? '' : 's'}.`,
    '',
    '## Ecosystem Summary',
    '',
    '| Ecosystem | Detected | Example files |',
    '| --- | ---: | --- |',
    ...inventory.groups.map((group) => `| ${group.ecosystem} | ${group.count} | ${group.files.slice(0, 4).map(formatCode).join(', ')} |`),
    '',
    '## Detected Surfaces',
    '',
    '| File | Ecosystem | Coverage | Why it matters |',
    '| --- | --- | --- | --- |',
    ...(inventory.surfaces.length > 0
      ? inventory.surfaces.map(
          (surface) =>
            `| ${formatCode(surface.path)} | ${surface.ecosystem} | ${surface.coverage.map(formatCode).join(', ')} | ${escapeTableCell(surface.whyItMatters)} |`
        )
      : ['| none | none | `contextforge doctor` | No agent-readable repo surfaces were detected. |']),
    '',
    '## Suggested Proof Commands',
    '',
    '```bash',
    'contextforge security-audit --min-security-score 80',
    'contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif',
    'contextforge pack --task "review agent context" --budget 20000 --output contextforge-pack.md',
    '```',
    ''
  ];
  return `${lines.join('\n')}\n`;
}

function inventoryItemForPath(relativePath: string): AgentSurfaceInventoryItem[] {
  const definition = surfaceDefinitions.find((item) => item.matches(relativePath));
  if (!definition) return [];
  return [
    {
      path: relativePath,
      ecosystem: definition.ecosystem,
      coverage: definition.coverage,
      whyItMatters: definition.whyItMatters
    }
  ];
}

function groupSurfaces(surfaces: AgentSurfaceInventoryItem[]): AgentSurfaceInventoryGroup[] {
  const groups = new Map<string, string[]>();
  for (const surface of surfaces) {
    const files = groups.get(surface.ecosystem) ?? [];
    files.push(surface.path);
    groups.set(surface.ecosystem, files);
  }
  return [...groups.entries()]
    .map(([ecosystem, files]) => ({
      ecosystem,
      count: files.length,
      files
    }))
    .sort((left, right) => left.ecosystem.localeCompare(right.ecosystem));
}

function isInventoryIgnored(relativePath: string): boolean {
  const [firstSegment] = relativePath.split('/');
  return firstSegment === 'fixtures' || firstSegment === 'tests';
}

function formatCode(value: string): string {
  return `\`${value.replace(/`/g, '\\`')}\``;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
