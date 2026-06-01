import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { scaffoldAgentContextFiles } from '../src/init/agentContext.js';

const execFileAsync = promisify(execFile);

describe('agent context file init scaffold', () => {
  it('writes minimal AGENTS.md and CLAUDE.md files for coding agents', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agent-context-'));
    const results = await scaffoldAgentContextFiles({
      rootDir,
      agentsMd: true,
      claudeMd: true,
      projectName: 'Example Service'
    });

    const agents = await readFile(path.join(rootDir, 'AGENTS.md'), 'utf8');
    const claude = await readFile(path.join(rootDir, 'CLAUDE.md'), 'utf8');

    expect(results.map((result) => result.created)).toEqual([true, true]);
    expect(agents).toContain('# Example Service Agent Guide');
    expect(agents).toContain('Keep this file short');
    expect(agents).toContain('Build and test');
    expect(agents).toContain('contextforge audit');
    expect(claude).toContain('# Example Service Claude Memory');
    expect(claude).toContain('Project commands');
    expect(claude).toContain('Do not add broad rules');
  });

  it('refuses to overwrite context files unless forced', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agent-context-'));
    const agentsPath = path.join(rootDir, 'AGENTS.md');
    await writeFile(agentsPath, '# Existing\n');

    const skipped = await scaffoldAgentContextFiles({ rootDir, agentsMd: true });
    const forced = await scaffoldAgentContextFiles({
      rootDir,
      agentsMd: true,
      projectName: 'Forced Project',
      force: true
    });

    expect(skipped[0].created).toBe(false);
    expect(forced[0].created).toBe(true);
    expect(await readFile(agentsPath, 'utf8')).toContain('# Forced Project Agent Guide');
  });

  it('writes minimal GitHub Copilot custom instructions when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-init-'));
    const results = await scaffoldAgentContextFiles({
      rootDir,
      copilotInstructions: true,
      projectName: 'Example Service'
    });

    const copilot = await readFile(path.join(rootDir, '.github/copilot-instructions.md'), 'utf8');

    expect(results).toEqual([
      expect.objectContaining({
        kind: 'copilot-instructions',
        created: true
      })
    ]);
    expect(copilot).toContain('# Example Service Copilot Instructions');
    expect(copilot).toContain('Keep this file short');
    expect(copilot).toContain('contextforge audit');
  });

  it('is available through the init CLI command', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agent-context-cli-'));
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'init',
      '--agents-md',
      '--claude-md',
      '--project-name',
      'CLI Project'
    ], { cwd: rootDir });

    expect(stdout).toContain('Wrote AGENTS.md');
    expect(stdout).toContain('Wrote CLAUDE.md');
    expect(await readFile(path.join(rootDir, 'AGENTS.md'), 'utf8')).toContain('# CLI Project Agent Guide');
    expect(await readFile(path.join(rootDir, 'CLAUDE.md'), 'utf8')).toContain('# CLI Project Claude Memory');
  });

  it('exposes Copilot instructions through the init CLI command', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-init-cli-'));
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'init',
      '--copilot-instructions',
      '--project-name',
      'CLI Project'
    ], { cwd: rootDir });

    expect(stdout).toContain('Wrote .github/copilot-instructions.md');
    expect(await readFile(path.join(rootDir, '.github/copilot-instructions.md'), 'utf8')).toContain('# CLI Project Copilot Instructions');
  });
});
