import path from 'node:path';
import { listFiles } from './files.js';

const AGENT_INSTRUCTION_FILE_NAMES = new Set(['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.cursorrules', '.clinerules', '.windsurfrules']);
const CONTEXT_FILE_NAMES = AGENT_INSTRUCTION_FILE_NAMES;
const SECURITY_CONTEXT_FILE_NAMES = new Set([...CONTEXT_FILE_NAMES, 'SKILL.md', 'README.md']);
const COPILOT_INSTRUCTIONS_FILE = '.github/copilot-instructions.md';

export interface ContextFileRef {
  absolutePath: string;
  relativePath: string;
}

export async function listContextFiles(rootDir: string): Promise<ContextFileRef[]> {
  return listNamedContextFiles(rootDir, (relativePath) => isNamedContextPath(relativePath, CONTEXT_FILE_NAMES));
}

export async function listSecurityContextFiles(rootDir: string): Promise<ContextFileRef[]> {
  return listNamedContextFiles(rootDir, (relativePath) => isSecurityContextPath(relativePath));
}

async function listNamedContextFiles(rootDir: string, matchesContextPath: (relativePath: string) => boolean): Promise<ContextFileRef[]> {
  const absoluteFiles = await listFiles(rootDir, (filePath) => matchesContextPath(path.relative(rootDir, filePath)));
  return absoluteFiles
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(rootDir, absolutePath).split(path.sep).join('/')
    }))
    .filter((file) => matchesContextPath(file.relativePath) && !isFixtureOrTestContext(file.relativePath));
}

function isFixtureOrTestContext(relativePath: string): boolean {
  const [firstSegment] = relativePath.split('/');
  return firstSegment === 'fixtures' || firstSegment === 'tests';
}

export function isCopilotInstructionPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return normalized === COPILOT_INSTRUCTIONS_FILE || /^\.github\/instructions\/.+\.instructions\.md$/i.test(normalized);
}

export function isCopilotArtifactPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return (
    /^\.github\/prompts\/.+\.prompt\.md$/i.test(normalized) ||
    /^\.github\/agents\/.+(\.agent)?\.md$/i.test(normalized) ||
    /^(\.github|\.claude|\.agents)\/skills\/[^/]+\/SKILL\.md$/i.test(normalized) ||
    /^\.claude\/agents\/.+\.md$/i.test(normalized) ||
    /^\.claude\/commands\/.+\.md$/i.test(normalized)
  );
}

export function isAdjacentAgentRulePath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return (
    /(^|\/)\.cursor\/rules\/.+\.mdc$/i.test(normalized) ||
    /^\.clinerules\/.+\.(md|txt)$/i.test(normalized) ||
    /(^|\/)\.windsurf\/rules\/.+\.(md|mdc|txt)$/i.test(normalized)
  );
}

export function isAgentInstructionContextPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return (
    AGENT_INSTRUCTION_FILE_NAMES.has(path.basename(normalized)) ||
    isCopilotInstructionPath(normalized) ||
    isCopilotArtifactPath(normalized) ||
    isAdjacentAgentRulePath(normalized)
  );
}

export function isCopilotHookConfigPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return (
    /^\.github\/hooks\/.+\.json$/i.test(normalized) ||
    normalized === '.github/copilot/settings.json' ||
    normalized === '.github/copilot/settings.local.json'
  );
}

export function isCopilotWorkspaceSettingsPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return normalized === '.vscode/settings.json' || /\.code-workspace$/i.test(normalized);
}

function isNamedContextPath(relativePath: string, names: Set<string>): boolean {
  return names.has(path.basename(relativePath)) || isAgentInstructionContextPath(relativePath);
}

function isSecurityContextPath(relativePath: string): boolean {
  return (
    isNamedContextPath(relativePath, SECURITY_CONTEXT_FILE_NAMES) ||
    isCopilotHookConfigPath(relativePath) ||
    isCopilotWorkspaceSettingsPath(relativePath)
  );
}
