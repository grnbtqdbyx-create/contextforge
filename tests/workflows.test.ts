import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('GitHub workflows', () => {
  it('opts JavaScript actions into the Node 24 runtime', async () => {
    const ci = await readFile('.github/workflows/ci.yml', 'utf8');
    const audit = await readFile('.github/workflows/contextforge-audit.yml', 'utf8');
    const npmPublish = await readFile('.github/workflows/npm-publish.yml', 'utf8');

    expect(ci).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
    expect(audit).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
    expect(npmPublish).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
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
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('github/codeql-action/upload-sarif');
    expect(workflow).toContain('contextforge.sarif');
  });
});
