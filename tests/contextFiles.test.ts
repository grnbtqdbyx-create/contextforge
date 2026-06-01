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

  it('discovers Copilot prompt files, custom agents, and project skills', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-artifacts-'));
    await mkdir(path.join(rootDir, '.github/prompts/security'), { recursive: true });
    await mkdir(path.join(rootDir, '.github/agents/release'), { recursive: true });
    await mkdir(path.join(rootDir, '.github/skills/deploy'), { recursive: true });
    await mkdir(path.join(rootDir, '.agents/skills/review'), { recursive: true });
    await mkdir(path.join(rootDir, '.claude/skills/docs'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/prompts/security/review.prompt.md'), 'Review the diff for security.\n');
    await writeFile(path.join(rootDir, '.github/agents/release/manager.agent.md'), 'You are the release manager.\n');
    await writeFile(path.join(rootDir, '.github/skills/deploy/SKILL.md'), 'Deploy safely.\n');
    await writeFile(path.join(rootDir, '.agents/skills/review/SKILL.md'), 'Review carefully.\n');
    await writeFile(path.join(rootDir, '.claude/skills/docs/SKILL.md'), 'Write docs.\n');

    const contextFiles = await listContextFiles(rootDir);
    const securityFiles = await listSecurityContextFiles(rootDir);

    expect(contextFiles.map((file) => file.relativePath)).toEqual([
      '.agents/skills/review/SKILL.md',
      '.claude/skills/docs/SKILL.md',
      '.github/agents/release/manager.agent.md',
      '.github/prompts/security/review.prompt.md',
      '.github/skills/deploy/SKILL.md'
    ]);
    expect(securityFiles.map((file) => file.relativePath)).toEqual(contextFiles.map((file) => file.relativePath));
  });

  it('discovers Copilot hook files only for security scans', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-hooks-'));
    await mkdir(path.join(rootDir, '.github/hooks'), { recursive: true });
    await mkdir(path.join(rootDir, '.github/copilot'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/hooks/pre-tool-use.json'), '{"command":"pnpm test"}\n');
    await writeFile(path.join(rootDir, '.github/copilot/settings.json'), '{"hooks":{"sessionStart":"pnpm lint"}}\n');
    await writeFile(path.join(rootDir, '.github/copilot/settings.local.json'), '{"hooks":{"sessionEnd":"pnpm test"}}\n');

    const contextFiles = await listContextFiles(rootDir);
    const securityFiles = await listSecurityContextFiles(rootDir);

    expect(contextFiles.map((file) => file.relativePath)).toEqual([]);
    expect(securityFiles.map((file) => file.relativePath)).toEqual([
      '.github/copilot/settings.json',
      '.github/copilot/settings.local.json',
      '.github/hooks/pre-tool-use.json'
    ]);
  });
});
