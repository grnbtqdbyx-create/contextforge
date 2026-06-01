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
      expect(workflow).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
    }
  });

  it('keeps npm publishing manual, OIDC-based, and dry-run by default', async () => {
    const workflow = await readFile('.github/workflows/npm-publish.yml', 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('attestations: write');
    expect(workflow).toContain('dry_run');
    expect(workflow).toContain('default: true');
    expect(workflow).toContain('needs: preflight');
    expect(workflow).toContain('environment: npm-publish');
    expect(workflow).toContain('npm pack --json > npm-pack.json');
    expect(workflow).toContain('actions/attest@v4');
    expect(workflow).toContain("subject-path: 'contextforge-*.tgz'");
    expect(workflow).toContain('npm publish contextforge-*.tgz --access public');
    expect(workflow).toContain('publish-readiness --summary contextforge-publish-readiness.md');
    expect(workflow).toContain('contextforge-publish-readiness.md');
    expect(workflow).toContain('npm-pack.json');
    expect(workflow).toContain("if: ${{ inputs.dry_run == false }}");
    expect(workflow).not.toContain('NPM_TOKEN');
  });

  it('uploads ContextForge SARIF to GitHub Code Scanning', async () => {
    const workflow = await readFile('.github/workflows/contextforge-audit.yml', 'utf8');

    expect(workflow).toContain('security-events: write');
    expect(workflow).toContain('--sarif contextforge.sarif');
    expect(workflow).toContain('--sarif contextforge-mcp.sarif');
    expect(workflow).toContain('--sarif contextforge-claude.sarif');
    expect(workflow).toContain('--summary contextforge-summary.md');
    expect(workflow).toContain('--plan contextforge-agent-plan.md');
    expect(workflow).toContain('--comment contextforge-pr-comment.md');
    expect(workflow).toContain('--badge contextforge-badge.svg --base main');
    expect(workflow).toContain('--suggestions contextforge-suggestions.json');
    expect(workflow).toContain('--badge contextforge-badge.svg');
    expect(workflow).toContain('proof-pack --output contextforge-proof-pack.md');
    expect(workflow).toContain('scorecard --output contextforge-scorecard.md');
    expect(workflow).toContain('surface-map --output contextforge-agent-surface-map.md');
    expect(workflow).toContain('surface-inventory --output contextforge-agent-surface-inventory.md');
    expect(workflow).toContain('surface-diff --base main --output contextforge-agent-surface-diff.md');
    expect(workflow).toContain('mcp-audit --summary contextforge-mcp-audit.md');
    expect(workflow).toContain('contextforge-mcp.sarif');
    expect(workflow).toContain('claude-audit --summary contextforge-claude-audit.md');
    expect(workflow).toContain('contextforge-claude.sarif');
    expect(workflow).toContain('trace-audit --summary contextforge-trace-audit.md');
    expect(workflow).toContain('review-kit --base main --output contextforge-review-kit.md');
    expect(workflow).toContain('artifact-map --output contextforge-artifact-map.md');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('github/codeql-action/upload-sarif');
    expect(workflow).toContain('contextforge.sarif');
    expect(workflow).toContain('contextforge-mcp.sarif');
    expect(workflow).toContain('contextforge-claude-audit.md');
    expect(workflow).toContain('contextforge-claude.sarif');
    expect(workflow).toContain('contextforge-agent-plan.md');
    expect(workflow).toContain('contextforge-pr-comment.md');
    expect(workflow).toContain('contextforge-suggestions.json');
    expect(workflow).toContain('contextforge-badge.svg');
    expect(workflow).toContain('contextforge-proof-pack.md');
    expect(workflow).toContain('contextforge-scorecard.md');
    expect(workflow).toContain('contextforge-agent-surface-map.md');
    expect(workflow).toContain('contextforge-agent-surface-inventory.md');
    expect(workflow).toContain('contextforge-agent-surface-diff.md');
    expect(workflow).toContain('contextforge-mcp-audit.md');
    expect(workflow).toContain('contextforge-claude-audit.md');
    expect(workflow).toContain('contextforge-review-kit.md');
    expect(workflow).toContain('contextforge-artifact-map.md');
    expect(workflow).toContain('contextforge-trace-audit.md');
  });
});
