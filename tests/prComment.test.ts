import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { createPrComment } from '../src/report/prComment.js';

const execFileAsync = promisify(execFile);

describe('PR comment output', () => {
  it('formats audit results as a compact sticky PR comment', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/security-project',
      minContextScore: 70,
      minCacheScore: 70,
      minSecurityScore: 70
    });

    const comment = createPrComment(audit);

    expect(comment).toContain('<!-- contextforge-pr-comment -->');
    expect(comment).toContain('## ContextForge Agent Context Gate');
    expect(comment).toContain('| Context health |');
    expect(comment).toContain('| Context security |');
    expect(comment).toContain('### Top Agent Fixes');
    expect(comment).toContain('`contextforge-proof-pack.md` for shareable doctor/audit proof');
    expect(comment).toContain('`contextforge-review-kit.md` for Codex/Claude review focus');
    expect(comment).toContain('unsafe-shell');
    expect(comment.length).toBeLessThan(4000);
  });

  it('writes a PR comment from the audit CLI when requested', async () => {
    const comment = 'contextforge-test-pr-comment.md';
    const auditPath = 'contextforge-test-audit.json';
    const reportPath = 'contextforge-test-report.html';
    await rm(comment, { force: true });
    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--comment',
      comment,
      '--output',
      auditPath,
      '--report',
      reportPath
    ]);

    const markdown = await readFile(comment, 'utf8');

    expect(markdown).toContain('<!-- contextforge-pr-comment -->');
    expect(markdown).toContain('ContextForge Agent Context Gate');
    expect(markdown).toContain('contextforge-proof-pack.md');
    expect(markdown).toContain('contextforge-review-kit.md');
    await rm(comment, { force: true });
    await rm(auditPath, { force: true });
    await rm(reportPath, { force: true });
  });
});
