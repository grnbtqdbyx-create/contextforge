import path from 'node:path';
import { listFiles } from './files.js';

const CONTEXT_FILE_NAMES = new Set(['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.clinerules']);
const SECURITY_CONTEXT_FILE_NAMES = new Set([...CONTEXT_FILE_NAMES, 'SKILL.md', 'README.md']);
const COPILOT_INSTRUCTIONS_FILE = '.github/copilot-instructions.md';

export interface ContextFileRef {
  absolutePath: string;
  relativePath: string;
}

export async function listContextFiles(rootDir: string): Promise<ContextFileRef[]> {
  return listNamedContextFiles(rootDir, CONTEXT_FILE_NAMES);
}

export async function listSecurityContextFiles(rootDir: string): Promise<ContextFileRef[]> {
  return listNamedContextFiles(rootDir, SECURITY_CONTEXT_FILE_NAMES);
}

async function listNamedContextFiles(rootDir: string, names: Set<string>): Promise<ContextFileRef[]> {
  const absoluteFiles = await listFiles(rootDir, (filePath) => names.has(path.basename(filePath)) || isCopilotInstructionPath(path.relative(rootDir, filePath)));
  return absoluteFiles
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(rootDir, absolutePath).split(path.sep).join('/')
    }))
    .filter((file) => (names.has(path.basename(file.relativePath)) || isCopilotInstructionPath(file.relativePath)) && !isFixtureOrTestContext(file.relativePath));
}

function isFixtureOrTestContext(relativePath: string): boolean {
  const [firstSegment] = relativePath.split('/');
  return firstSegment === 'fixtures' || firstSegment === 'tests';
}

export function isCopilotInstructionPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  return normalized === COPILOT_INSTRUCTIONS_FILE || /^\.github\/instructions\/.+\.instructions\.md$/i.test(normalized);
}
