import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listContextFiles, listSecurityContextFiles } from '../src/utils/contextFiles.js';

describe('context file discovery', () => {
  it('skips repository fixture and test context files during repo-root scans', async () => {
    const files = await listSecurityContextFiles(process.cwd());

    expect(files.some((file) => file.relativePath.startsWith('fixtures/security-benchmark/'))).toBe(false);
    expect(files.some((file) => file.relativePath.startsWith('tests/'))).toBe(false);
  });

  it('discovers GitHub Copilot repository and path-scoped instruction files', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-context-'));
    await mkdir(path.join(rootDir, '.github/instructions/api'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/copilot-instructions.md'), 'Use pnpm test before edits.\n');
    await writeFile(path.join(rootDir, '.github/instructions/api.instructions.md'), 'Apply to API files only.\n');
    await writeFile(path.join(rootDir, '.github/instructions/api/routes.instructions.md'), 'Apply to nested route files.\n');

    const contextFiles = await listContextFiles(rootDir);
    const securityFiles = await listSecurityContextFiles(rootDir);

    expect(contextFiles.map((file) => file.relativePath)).toEqual([
      '.github/copilot-instructions.md',
      '.github/instructions/api.instructions.md',
      '.github/instructions/api/routes.instructions.md'
    ]);
    expect(securityFiles.map((file) => file.relativePath)).toEqual([
      '.github/copilot-instructions.md',
      '.github/instructions/api.instructions.md',
      '.github/instructions/api/routes.instructions.md'
    ]);
  });
});
