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
  const absoluteFiles = await listFiles(rootDir, (filePath) => isNamedContextPath(path.relative(rootDir, filePath), names));
  return absoluteFiles
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(rootDir, absolutePath).split(path.sep).join('/')
    }))
    .filter((file) => isNamedContextPath(file.relativePath, names) && !isFixtureOrTestContext(file.relativePath));
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
    /^(\.github|\.claude|\.agents)\/skills\/[^/]+\/SKILL\.md$/i.test(normalized)
  );
}

export function isAgentInstructionContextPath(relativePath: string): boolean {
  return isCopilotInstructionPath(relativePath) || isCopilotArtifactPath(relativePath);
}

function isNamedContextPath(relativePath: string, names: Set<string>): boolean {
  return names.has(path.basename(relativePath)) || isAgentInstructionContextPath(relativePath);
}
