import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('GitHub workflows', () => {
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
});
