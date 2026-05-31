import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_GITHUB_ACTION_REF = 'grnbtqdbyx-create/contextforge@v0.16.0';

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
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
            contextforge-summary.md
      - uses: github/codeql-action/upload-sarif@v4
        if: ${sarifGuard}
        with:
          sarif_file: contextforge.sarif
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
