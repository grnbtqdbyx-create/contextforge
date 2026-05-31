import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { scanClaudeSessions } from '../src/scanners/claude.js';
import { scanCodexSessions } from '../src/scanners/codex.js';

describe('audit builder', () => {
  it('produces a CI-ready audit with scores, status, and next actions', async () => {
    const records = [
      ...(await scanClaudeSessions({ demo: true })),
      ...(await scanCodexSessions({ demo: true }))
    ];
    const audit = await buildAudit({
      records,
      rootDir: 'fixtures/project',
      minContextScore: 70,
      minCacheScore: 70
    });

    expect(audit.status).toBe('pass');
    expect(audit.scores.contextHealth).toBeGreaterThanOrEqual(70);
    expect(audit.scores.cacheStability).toBeGreaterThanOrEqual(70);
    expect(audit.summary.totalTokens).toBeGreaterThan(0);
    expect(audit.nextActions.length).toBeGreaterThan(0);
  });

  it('fails when configured score thresholds are not met', async () => {
    const records = await scanClaudeSessions({ demo: true });
    const audit = await buildAudit({
      records,
      rootDir: 'fixtures/project',
      minContextScore: 95,
      minCacheScore: 95
    });

    expect(audit.status).toBe('fail');
    expect(audit.failures.some((failure) => failure.includes('Context health'))).toBe(true);
    expect(audit.failures.some((failure) => failure.includes('Cache stability'))).toBe(true);
  });
});
