import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNpmPublishReadiness, formatNpmPublishReadiness } from '../src/publish/npmReadiness.js';

describe('npm publish readiness', () => {
  it('separates verified local publish setup from human npm account steps', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-npm-readiness-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await mkdir(path.join(rootDir, 'docs'), { recursive: true });
    await writeFile(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'contextforge',
        version: '1.2.3',
        bin: { contextforge: 'dist/cli.js' },
        publishConfig: { access: 'public' },
        packageManager: 'pnpm@11.2.2'
      })
    );
    await writeFile(
      path.join(rootDir, '.github/workflows/npm-publish.yml'),
      [
        'name: npm Publish',
        'on:',
        '  workflow_dispatch:',
        '    inputs:',
        '      dry_run:',
        '        default: true',
        'permissions:',
        '  contents: read',
        '  id-token: write',
        'jobs:',
        '  preflight:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: pnpm typecheck',
        '      - run: pnpm test',
        '      - run: pnpm build',
        '      - run: node dist/cli.js security-benchmark',
        '      - run: node dist/cli.js audit --min-context-score 70 --min-cache-score 70 --min-security-score 70',
        '      - run: npm pack --dry-run',
        '  publish:',
        '    if: ${{ inputs.dry_run == false }}',
        '    environment: npm-publish',
        '    steps:',
        '      - run: npm publish --access public --tag "${{ inputs.npm_tag }}"'
      ].join('\n')
    );
    await writeFile(
      path.join(rootDir, 'docs/npm-publish.md'),
      'Configure Trusted Publishing for grnbtqdbyx-create/contextforge and verify with npm view contextforge name version.\n'
    );

    const result = await createNpmPublishReadiness({ rootDir });
    const text = formatNpmPublishReadiness(result);

    expect(result.status).toBe('warn');
    expect(result.checks.find((check) => check.name === 'Package metadata')?.status).toBe('pass');
    expect(result.checks.find((check) => check.name === 'Trusted publishing workflow')?.status).toBe('pass');
    expect(result.checks.find((check) => check.name === 'Human npm account setup')?.status).toBe('warn');
    expect(text).toContain('ContextForge npm publish readiness: warn');
    expect(text).toContain('npm Trusted Publishing');
  });
});
