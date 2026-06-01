import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditGithubActions, createGithubActionsSummary, formatGithubActionsAudit } from '../src/analyzers/githubActions.js';
import { createGithubActionsSarif } from '../src/report/githubActionsSarif.js';

describe('GitHub Actions audit', () => {
  it('detects unpinned actions, pwn-request checkout, and script injection', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-actions-risk-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await writeFile(
      path.join(rootDir, '.github/workflows/risky.yml'),
      [
        'name: Risky',
        'on:',
        '  pull_request_target:',
        'permissions:',
        '  contents: write',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v5',
        '        with:',
        '          ref: ${{ github.event.pull_request.head.sha }}',
        '      - uses: third-party/example-action@main',
        '      - run: echo "${{ github.event.pull_request.title }}"'
      ].join('\n')
    );

    const audit = await auditGithubActions({ rootDir });
    const types = audit.findings.map((finding) => finding.type);
    const summary = createGithubActionsSummary(audit);
    const text = formatGithubActionsAudit(audit);
    const sarif = createGithubActionsSarif(audit);

    expect(audit.status).toBe('fail');
    expect(audit.files).toEqual(['.github/workflows/risky.yml']);
    expect(types).toContain('actions-unpinned-action');
    expect(types).toContain('actions-pwn-request-checkout');
    expect(types).toContain('actions-script-injection');
    expect(text).toContain('ContextForge GitHub Actions audit: fail');
    expect(summary).toContain('# ContextForge GitHub Actions Audit');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge GitHub Actions');
    expect(sarif.runs[0].results.some((result) => result.ruleId === 'github-actions/actions-pwn-request-checkout')).toBe(true);
  });

  it('passes pinned read-only workflows', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-actions-safe-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await writeFile(
      path.join(rootDir, '.github/workflows/ci.yml'),
      [
        'name: CI',
        'on:',
        '  pull_request:',
        'permissions:',
        '  contents: read',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@8f4b7f84864484a7bf31766abe9204da3cbe65b3',
        '      - run: pnpm test'
      ].join('\n')
    );

    const audit = await auditGithubActions({ rootDir });

    expect(audit.status).toBe('pass');
    expect(audit.findings).toHaveLength(0);
  });
});
