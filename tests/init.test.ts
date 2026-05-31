import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { scaffoldGithubActionWorkflow } from '../src/init/githubAction.js';

const execFileAsync = promisify(execFile);

describe('GitHub Action init scaffold', () => {
  it('writes a reusable ContextForge workflow with artifacts and SARIF upload', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-init-'));
    const result = await scaffoldGithubActionWorkflow({
      rootDir,
      actionRef: 'grnbtqdbyx-create/contextforge@v0.test'
    });

    const workflow = await readFile(result.path, 'utf8');

    expect(result.created).toBe(true);
    expect(workflow).toContain('uses: grnbtqdbyx-create/contextforge@v0.test');
    expect(workflow).toContain('contextforge-audit.json');
    expect(workflow).toContain('contextforge-report.html');
    expect(workflow).toContain('contextforge.sarif');
    expect(workflow).toContain('contextforge-summary.md');
    expect(workflow).toContain('contextforge-pr-comment.md');
    expect(workflow).toContain('github/codeql-action/upload-sarif');
    expect(workflow).toContain('github.event.pull_request.head.repo.full_name == github.repository');
    expect(workflow).not.toContain('pnpm/action-setup');
    expect(workflow).not.toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24');
  });

  it('refuses to overwrite an existing workflow unless forced', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-init-'));
    const workflowPath = path.join(rootDir, '.github/workflows/contextforge-audit.yml');
    await mkdir(path.dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, 'name: Existing\n');

    const skipped = await scaffoldGithubActionWorkflow({
      rootDir,
      actionRef: 'grnbtqdbyx-create/contextforge@v0.test'
    });
    const forced = await scaffoldGithubActionWorkflow({
      rootDir,
      actionRef: 'grnbtqdbyx-create/contextforge@v0.test',
      force: true
    });

    expect(skipped.created).toBe(false);
    expect(forced.created).toBe(true);
    expect(await readFile(workflowPath, 'utf8')).toContain('uses: grnbtqdbyx-create/contextforge@v0.test');
  });

  it('is available through the init CLI command', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-init-cli-'));
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'init',
      '--github-action',
      '--action-ref',
      'grnbtqdbyx-create/contextforge@v0.test'
    ], { cwd: rootDir });
    const workflow = await readFile(path.join(rootDir, '.github/workflows/contextforge-audit.yml'), 'utf8');

    expect(stdout).toContain('Wrote .github/workflows/contextforge-audit.yml');
    expect(workflow).toContain('uses: grnbtqdbyx-create/contextforge@v0.test');
  });
});
