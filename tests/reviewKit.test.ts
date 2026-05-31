import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { collectChangedFiles } from '../src/cli.js';
import { createReviewKit, reviewFocusForFiles } from '../src/report/reviewKit.js';

const execFileAsync = promisify(execFile);

describe('review kit report', () => {
  it('turns changed files into Codex and Claude review focus areas', () => {
    const focus = reviewFocusForFiles([
      'README.md',
      '.github/workflows/contextforge-audit.yml',
      'src/report/prComment.ts',
      'tests/prComment.test.ts'
    ]);

    expect(focus).toContain('Agent-readable instructions and README entrypoints changed; check for noisy context or prompt-injection risk.');
    expect(focus).toContain('GitHub workflow files changed; verify permissions, artifact paths, and fork-safe behavior.');
    expect(focus).toContain('Runtime source changed; verify behavior with focused tests and the built CLI.');
    expect(focus).toContain('Tests changed; verify the new expectations fail before implementation and pass after.');
  });

  it('does not classify test-only TypeScript changes as runtime source changes', () => {
    const focus = reviewFocusForFiles(['tests/reviewKit.test.ts']);

    expect(focus).toContain('Tests changed; verify the new expectations fail before implementation and pass after.');
    expect(focus).not.toContain('Runtime source changed; verify behavior with focused tests and the built CLI.');
  });

  it('writes a deterministic review brief for Codex and Claude', () => {
    const kit = createReviewKit({
      projectName: 'ContextForge',
      baseRef: 'main',
      changedFiles: ['README.md', 'src/report/prComment.ts', 'tests/prComment.test.ts']
    });

    expect(kit).toContain('# ContextForge Review Kit');
    expect(kit).toContain('| Base ref | `main` |');
    expect(kit).toContain('- `src/report/prComment.ts`');
    expect(kit).toContain('## Evidence Commands');
    expect(kit).toContain('contextforge review-kit --base main --output contextforge-review-kit.md');
    expect(kit).toContain('## Codex / Claude Review Prompt');
    expect(kit).toContain('You are reviewing a ContextForge pull request for correctness, safety, and agent usefulness.');
    expect(kit).toContain('Read `contextforge-pr-comment.md`, `contextforge-agent-plan.md`, and `contextforge-proof-pack.md` if they exist.');
  });

  it('collects uncommitted working tree files for pre-PR autoreview', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-review-kit-git-'));
    await execFileAsync('git', ['init', '-b', 'main'], { cwd: rootDir });
    await writeFile(path.join(rootDir, 'README.md'), '# Example\n');
    await execFileAsync('git', ['add', 'README.md'], { cwd: rootDir });
    await execFileAsync('git', ['-c', 'user.name=ContextForge Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Initial commit'], {
      cwd: rootDir
    });
    await mkdir(path.join(rootDir, 'src'), { recursive: true });
    await writeFile(path.join(rootDir, 'src/new-feature.ts'), 'export const value = 1;\n');

    await expect(collectChangedFiles('main', rootDir)).resolves.toContain('src/new-feature.ts');
    await rm(rootDir, { recursive: true, force: true });
  });
});
