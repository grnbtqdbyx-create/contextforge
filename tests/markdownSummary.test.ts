import { readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { createMarkdownSummary } from '../src/report/markdownSummary.js';

const execFileAsync = promisify(execFile);

describe('Markdown audit summary', () => {
  it('summarizes status, scores, findings, and next actions', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/security-project',
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 80
    });

    const markdown = createMarkdownSummary(audit);

    expect(markdown).toContain('# ContextForge Audit Summary');
    expect(markdown).toContain('| Context health |');
    expect(markdown).toContain('| Context security |');
    expect(markdown).toContain('## Top Findings');
    expect(markdown).toContain('## Next Actions');
  });

  it('writes a Markdown summary from the audit CLI when requested', async () => {
    const summary = 'contextforge-test-summary.md';
    await rm(summary, { force: true });
    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--summary',
      summary,
      '--output',
      'contextforge-test-audit.json',
      '--report',
      'contextforge-test-report.html'
    ]);

    const markdown = await readFile(summary, 'utf8');

    expect(markdown).toContain('# ContextForge Audit Summary');
    expect(markdown).toContain('## Scores');
    await rm(summary, { force: true });
    await rm('contextforge-test-audit.json', { force: true });
    await rm('contextforge-test-report.html', { force: true });
  });
});
