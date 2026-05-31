import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_GITHUB_ACTION_REF = 'grnbtqdbyx-create/contextforge@v0.27.0';

export interface GithubActionScaffoldOptions {
  rootDir: string;
  actionRef?: string;
  force?: boolean;
}

export interface GithubActionScaffoldResult {
  path: string;
  created: boolean;
}

export async function scaffoldGithubActionWorkflow(options: GithubActionScaffoldOptions): Promise<GithubActionScaffoldResult> {
  const workflowPath = path.join(options.rootDir, '.github', 'workflows', 'contextforge-audit.yml');
  if (!options.force && (await fileExists(workflowPath))) return { path: workflowPath, created: false };

  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, githubActionWorkflow(options.actionRef ?? DEFAULT_GITHUB_ACTION_REF));
  return { path: workflowPath, created: true };
}

export async function scaffoldPrCommentWorkflow(options: GithubActionScaffoldOptions): Promise<GithubActionScaffoldResult> {
  const workflowPath = path.join(options.rootDir, '.github', 'workflows', 'contextforge-pr-comment.yml');
  if (!options.force && (await fileExists(workflowPath))) return { path: workflowPath, created: false };

  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, prCommentWorkflow());
  return { path: workflowPath, created: true };
}

function githubActionWorkflow(actionRef: string): string {
  const sarifGuard = "${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}";

  return `name: ContextForge Audit

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  contextforge-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ${actionRef}
        with:
          min-context-score: 60
          min-cache-score: 60
          min-security-score: 60
          output: contextforge-audit.json
          report: contextforge-report.html
          sarif: contextforge.sarif
          summary: contextforge-summary.md
          plan: contextforge-agent-plan.md
          comment: contextforge-pr-comment.md
          suggestions: contextforge-suggestions.json
          badge: contextforge-badge.svg
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
            contextforge-summary.md
            contextforge-agent-plan.md
            contextforge-pr-comment.md
            contextforge-suggestions.json
            contextforge-badge.svg
      - uses: github/codeql-action/upload-sarif@v4
        if: ${sarifGuard}
        with:
          sarif_file: contextforge.sarif
`;
}

function prCommentWorkflow(): string {
  const runGuard = "${{ github.event.workflow_run.event == 'pull_request' && github.event.workflow_run.conclusion != 'skipped' && github.event.workflow_run.pull_requests[0].number }}";
  const runId = "${{ github.event.workflow_run.id }}";
  const githubToken = "${{ github.token }}";
  const pullRequestNumber = "${{ github.event.workflow_run.pull_requests[0].number }}";

  return `name: ContextForge PR Comment

on:
  workflow_run:
    workflows: ["ContextForge Audit"]
    types: [completed]

permissions:
  actions: read
  contents: read
  pull-requests: write

jobs:
  contextforge-pr-comment:
    if: ${runGuard}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v6
        with:
          name: contextforge-audit
          run-id: ${runId}
          github-token: ${githubToken}
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: contextforge
          number: ${pullRequestNumber}
          path: contextforge-pr-comment.md
`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
