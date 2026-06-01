import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { createAgentSurfaceDiff, createAgentSurfaceDiffMarkdown } from '../src/report/agentSurfaceDiff.js';

const execFileAsync = promisify(execFile);

describe('agent surface diff', () => {
  it('classifies changed agent-readable PR surfaces and ignores ordinary source files', () => {
    const diff = createAgentSurfaceDiff({
      baseRef: 'main',
      changes: [
        { status: 'A', path: 'AGENTS.md' },
        { status: 'M', path: '.github/copilot-instructions.md' },
        { status: 'D', path: 'docs/internal.md' },
        { status: 'R', path: '.cursorrules', previousPath: '.cursor/rules/review.mdc' },
        { status: 'M', path: 'src/app.ts' }
      ]
    });
    const markdown = createAgentSurfaceDiffMarkdown(diff);

    expect(diff.totalChangedSurfaces).toBe(3);
    expect(diff.affectedEcosystems).toEqual(['Adjacent agent rules', 'GitHub Copilot', 'OpenAI Codex']);
    expect(diff.changes.map((change) => `${change.action}:${change.path}`).sort()).toEqual([
      'added:AGENTS.md',
      'modified:.github/copilot-instructions.md',
      'renamed:.cursorrules'
    ]);
    expect(diff.changes.find((change) => change.action === 'renamed')?.previousPath).toBe('.cursor/rules/review.mdc');
    expect(diff.ignoredFiles).toEqual(['docs/internal.md', 'src/app.ts']);
    expect(markdown).toContain('# ContextForge Agent Surface Diff');
    expect(markdown).toContain('| `.github/copilot-instructions.md` | modified | GitHub Copilot |');
    expect(markdown).toContain('| `.cursor/rules/review.mdc` -> `.cursorrules` | renamed | Adjacent agent rules |');
    expect(markdown).toContain('contextforge surface-diff --base main --output contextforge-agent-surface-diff.md');
  });

  it('writes a Markdown diff artifact from the CLI', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-surface-diff-cli-'));
    const outputPath = path.join(rootDir, 'surface-diff.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'surface-diff', '--output', outputPath]);
    const markdown = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(markdown).toContain('# ContextForge Agent Surface Diff');
    expect(markdown).toContain('## Changed Agent Surfaces');
    await rm(rootDir, { recursive: true, force: true });
  });
});
