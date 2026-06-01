import { promises as fs } from 'node:fs';
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
  const files = await listNamedContextFiles(rootDir, (relativePath) => isNamedContextPath(relativePath, CONTEXT_FILE_NAMES));
  return mergeContextFiles(files, await listConfiguredCopilotInstructionFiles(rootDir));
}

export async function listSecurityContextFiles(rootDir: string): Promise<ContextFileRef[]> {
  const files = await listNamedContextFiles(rootDir, (relativePath) => isSecurityContextPath(relativePath));
  return mergeContextFiles(files, await listConfiguredCopilotInstructionFiles(rootDir));
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

async function listConfiguredCopilotInstructionFiles(rootDir: string): Promise<ContextFileRef[]> {
  const settingsFiles = await listFiles(rootDir, (filePath) => {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    return relativePath === '.vscode/settings.json' || /\.code-workspace$/i.test(relativePath);
  });
  const configuredLocations = new Set<string>();

  for (const settingsFile of settingsFiles) {
    const relativePath = path.relative(rootDir, settingsFile).split(path.sep).join('/');
    const settings = await readCopilotInstructionSettings(settingsFile, relativePath);
    const locations = getRecord(settings?.['chat.instructionsFilesLocations']);
    if (!locations) continue;
    for (const [location, enabled] of Object.entries(locations)) {
      if (enabled === true && isRepositoryRelativeLocation(location)) {
        configuredLocations.add(normalizeInstructionLocation(location).replace(/\/+$/, ''));
      }
    }
  }

  const files: ContextFileRef[] = [];
  for (const location of configuredLocations) {
    const absoluteLocation = path.join(rootDir, location);
    const instructionFiles = await listFiles(absoluteLocation, (filePath) => /\.instructions\.md$/i.test(filePath));
    files.push(
      ...instructionFiles.map((absolutePath) => ({
        absolutePath,
        relativePath: path.relative(rootDir, absolutePath).split(path.sep).join('/')
      }))
    );
  }

  return files.filter((file) => !isFixtureOrTestContext(file.relativePath));
}

async function readCopilotInstructionSettings(settingsFile: string, relativePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    const parsed = JSON.parse(stripJsonComments(await fs.readFile(settingsFile, 'utf8'))) as unknown;
    const root = getRecord(parsed);
    if (!root) return undefined;
    return /\.code-workspace$/i.test(relativePath) ? getRecord(root.settings) : root;
  } catch {
    return undefined;
  }
}

function stripJsonComments(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
    } else if (char === '/' && next === '/') {
      while (index < input.length && input[index] !== '\n') index += 1;
      output += '\n';
    } else if (char === '/' && next === '*') {
      index += 2;
      while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) index += 1;
      index += 1;
    } else {
      output += char;
    }
  }
  return output.replace(/,\s*([}\]])/g, '$1');
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function isRepositoryRelativeLocation(location: string): boolean {
  const normalized = normalizeInstructionLocation(location);
  return (
    normalized.length > 0 &&
    !normalized.startsWith('/') &&
    !normalized.startsWith('~') &&
    !normalized.includes('://') &&
    !normalized.split('/').includes('..')
  );
}

function normalizeInstructionLocation(location: string): string {
  return location.replace(/\\/g, '/').split(path.sep).join('/');
}

function mergeContextFiles(files: ContextFileRef[], configuredFiles: ContextFileRef[]): ContextFileRef[] {
  const byPath = new Map<string, ContextFileRef>();
  for (const file of [...files, ...configuredFiles]) {
    byPath.set(file.relativePath, file);
  }
  return [...byPath.values()].sort((left, right) => left.relativePath.localeCompare(right.relativePath));
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
