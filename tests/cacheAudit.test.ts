import { describe, expect, it } from 'vitest';
import { auditCacheStability } from '../src/analyzers/cacheAudit.js';
import type { SessionRecord } from '../src/types.js';

describe('cache audit', () => {
  it('reports unstable prefix risks and cache hit ratio', () => {
    const audit = auditCacheStability([
      { provider: 'claude', source: 'x', project: 'p', kind: 'assistant', content: 'Generated at 2026-05-31T18:00:00Z', inputTokens: 1000, outputTokens: 20, cachedTokens: 0 },
      { provider: 'codex', source: 'x', project: 'p', kind: 'tool', content: 'large log', inputTokens: 1000, outputTokens: 9000, cachedTokens: 500 }
    ]);
    expect(audit.score).toBeLessThan(100);
    expect(audit.cacheHitRatio).toBeGreaterThan(0);
    expect(audit.findings.some((finding) => finding.type === 'volatile-prefix')).toBe(true);
  });
});
