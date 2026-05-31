import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { scaffoldGithubActionWorkflow, scaffoldPrCommentWorkflow } from '../src/init/githubAction.js';

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
    expect(workflow).toContain('contextforge-proof-pack.md');
    expect(workflow).toContain('contextforge-scorecard.md');
    expect(workflow).toContain('contextforge-mcp-audit.md');
    expect(workflow).toContain('contextforge-review-kit.md');
    expect(workflow).toContain('contextforge-artifact-map.md');
    expect(workflow).toContain('proof-pack: contextforge-proof-pack.md');
    expect(workflow).toContain('scorecard: contextforge-scorecard.md');
    expect(workflow).toContain('mcp-audit: contextforge-mcp-audit.md');
    expect(workflow).toContain('review-kit: contextforge-review-kit.md');
    expect(workflow).toContain('artifact-map: contextforge-artifact-map.md');
    expect(workflow).toContain('review-base-ref: main');
    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).toContain('github/codeql-action/upload-sarif');
    expect(workflow).toContain('github.event.pull_request.head.repo.full_name == github.repository');
    expect(workflow).not.toContain('pnpm/action-setup');
    expect(workflow).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
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

  it('uses the latest released action ref by default', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-init-default-ref-'));
    const result = await scaffoldGithubActionWorkflow({ rootDir });

    expect(await readFile(result.path, 'utf8')).toContain('uses: grnbtqdbyx-create/contextforge@v0.46.0');
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

  it('writes an opt-in sticky PR comment workflow', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-pr-comment-init-'));
    const result = await scaffoldPrCommentWorkflow({ rootDir });

    const workflow = await readFile(result.path, 'utf8');

    expect(result.created).toBe(true);
    expect(result.path).toContain('contextforge-pr-comment.yml');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('contextforge-pr-comment.md');
    expect(workflow).toContain('workflow_run.pull_requests[0].number');
    expect(workflow).toContain('marocchino/sticky-pull-request-comment@v2');
    expect(workflow).toContain('header: contextforge');
    expect(workflow).toContain('number: ${{ github.event.workflow_run.pull_requests[0].number }}');
    expect(workflow).toContain('path: contextforge-pr-comment.md');
  });

  it('can scaffold the PR comment workflow from the init CLI command', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-pr-comment-cli-'));
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'init',
      '--pr-comment-workflow'
    ], { cwd: rootDir });
    const workflow = await readFile(path.join(rootDir, '.github/workflows/contextforge-pr-comment.yml'), 'utf8');

    expect(stdout).toContain('Wrote .github/workflows/contextforge-pr-comment.yml');
    expect(workflow).toContain('contextforge-pr-comment.md');
  });

  it('can scaffold the full recommended setup from the init CLI command', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-init-all-cli-'));
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'init',
      '--all',
      '--project-name',
      'Example Repo',
      '--action-ref',
      'grnbtqdbyx-create/contextforge@v0.test'
    ], { cwd: rootDir });

    expect(stdout).toContain('Wrote .github/workflows/contextforge-audit.yml');
    expect(stdout).toContain('Wrote .github/workflows/contextforge-pr-comment.yml');
    expect(stdout).toContain('Wrote AGENTS.md');
    expect(stdout).toContain('Wrote CLAUDE.md');
    expect(await readFile(path.join(rootDir, '.github/workflows/contextforge-audit.yml'), 'utf8')).toContain('uses: grnbtqdbyx-create/contextforge@v0.test');
    expect(await readFile(path.join(rootDir, '.github/workflows/contextforge-pr-comment.yml'), 'utf8')).toContain('sticky-pull-request-comment');
    expect(await readFile(path.join(rootDir, 'AGENTS.md'), 'utf8')).toContain('Example Repo');
    expect(await readFile(path.join(rootDir, 'CLAUDE.md'), 'utf8')).toContain('Example Repo');
  });
});
