import { describe, expect, it } from 'vitest';
import { summarizeUsage } from '../src/analyzers/usage.js';
import type { SessionRecord } from '../src/types.js';

describe('usage analyzer', () => {
  it('summarizes total and per-kind usage', () => {
    const records: SessionRecord[] = [
      { provider: 'codex', source: 'a', project: 'p', kind: 'user', content: 'hi', inputTokens: 10, outputTokens: 0, cachedTokens: 0 },
      { provider: 'codex', source: 'a', project: 'p', kind: 'tool', content: 'log', inputTokens: 0, outputTokens: 30, cachedTokens: 5 }
    ];
    const summary = summarizeUsage(records);
    expect(summary.totalTokens).toBe(40);
    expect(summary.cachedTokens).toBe(5);
    expect(summary.byKind.tool.totalTokens).toBe(30);
  });
});
