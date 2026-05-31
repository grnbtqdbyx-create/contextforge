import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('GitHub workflows', () => {
  it('uses Corepack instead of deprecated Node 20 pnpm setup actions', async () => {
    const ci = await readFile('.github/workflows/ci.yml', 'utf8');
    const audit = await readFile('.github/workflows/contextforge-audit.yml', 'utf8');
    const npmPublish = await readFile('.github/workflows/npm-publish.yml', 'utf8');

    for (const workflow of [ci, audit, npmPublish]) {
      expect(workflow).not.toContain('pnpm/action-setup');
      expect(workflow).toContain('package-manager-cache: false');
      expect(workflow).toContain('corepack enable');
      expect(workflow).toContain('corepack prepare pnpm@11.2.2 --activate');
    }
  });

  it('keeps npm publishing manual, OIDC-based, and dry-run by default', async () => {
    const workflow = await readFile('.github/workflows/npm-publish.yml', 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('dry_run');
    expect(workflow).toContain('default: true');
    expect(workflow).toContain('needs: preflight');
    expect(workflow).toContain('environment: npm-publish');
    expect(workflow).toContain('npm publish --access public');
    expect(workflow).toContain("if: ${{ inputs.dry_run == false }}");
    expect(workflow).not.toContain('NPM_TOKEN');
  });

  it('uploads ContextForge SARIF to GitHub Code Scanning', async () => {
    const workflow = await readFile('.github/workflows/contextforge-audit.yml', 'utf8');

    expect(workflow).toContain('security-events: write');
    expect(workflow).toContain('--sarif contextforge.sarif');
    expect(workflow).toContain('--summary contextforge-summary.md');
    expect(workflow).toContain('--plan contextforge-agent-plan.md');
    expect(workflow).toContain('--comment contextforge-pr-comment.md');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('github/codeql-action/upload-sarif');
    expect(workflow).toContain('contextforge.sarif');
    expect(workflow).toContain('contextforge-agent-plan.md');
    expect(workflow).toContain('contextforge-pr-comment.md');
  });
});
