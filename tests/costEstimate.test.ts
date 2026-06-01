import { describe, expect, it } from 'vitest';
import { createCostEstimateSummary, estimateSessionCost, formatCostEstimate } from '../src/analyzers/costEstimate.js';
import type { SessionRecord } from '../src/types.js';

function record(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    provider: 'codex',
    source: 'session.jsonl',
    project: 'demo',
    kind: 'assistant',
    content: 'result',
    inputTokens: 1_000_000,
    outputTokens: 100_000,
    cachedTokens: 400_000,
    ...overrides
  };
}

describe('session cost estimate', () => {
  it('estimates cost from configurable per-million token prices', () => {
    const estimate = estimateSessionCost(
      [
        record({ provider: 'codex', project: 'repo-a' }),
        record({ provider: 'claude', project: 'repo-b', inputTokens: 500_000, outputTokens: 50_000, cachedTokens: 100_000 })
      ],
      { inputPerMTok: 2, cachedInputPerMTok: 0.2, outputPerMTok: 10 }
    );

    expect(estimate.priced).toBe(true);
    expect(estimate.uncachedInputTokens).toBe(1_000_000);
    expect(estimate.cachedInputTokens).toBe(500_000);
    expect(estimate.outputTokens).toBe(150_000);
    expect(estimate.totalUsd).toBeCloseTo(3.6);
    expect(estimate.byProvider.codex.totalUsd).toBeCloseTo(2.28);
    expect(estimate.byProvider.claude.totalUsd).toBeCloseTo(1.32);
    expect(formatCostEstimate(estimate)).toContain('ContextForge cost estimate: priced');
    expect(createCostEstimateSummary(estimate)).toContain('# ContextForge Cost Estimate');
  });

  it('reports token totals without pretending to know provider prices', () => {
    const estimate = estimateSessionCost([record({ cachedTokens: 250_000 })], {});

    expect(estimate.priced).toBe(false);
    expect(estimate.totalUsd).toBe(0);
    expect(formatCostEstimate(estimate)).toContain('Set price flags');
  });
});
