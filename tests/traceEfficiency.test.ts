import { describe, expect, it } from 'vitest';
import { auditTraceEfficiency, createTraceEfficiencySummary, formatTraceEfficiencyAudit } from '../src/analyzers/traceEfficiency.js';
import type { SessionRecord } from '../src/types.js';

function record(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    provider: 'codex',
    source: 'session.jsonl',
    project: 'demo',
    kind: 'tool',
    content: 'pnpm test',
    inputTokens: 400,
    outputTokens: 100,
    cachedTokens: 0,
    toolName: 'exec_command',
    ...overrides
  };
}

describe('trace efficiency audit', () => {
  it('detects redundant tool calls, dominant tool output, and low cache reuse', () => {
    const audit = auditTraceEfficiency([
      record({ content: 'pnpm test', outputTokens: 2800 }),
      record({ content: 'pnpm test', outputTokens: 2800 }),
      record({ toolName: 'read_thread_terminal', content: 'terminal output'.repeat(700), inputTokens: 8000, outputTokens: 9000 }),
      record({ kind: 'assistant', content: 'analysis', inputTokens: 5000, outputTokens: 300, cachedTokens: 100, toolName: undefined })
    ]);
    const types = audit.findings.map((finding) => finding.type);

    expect(audit.status).toBe('warn');
    expect(audit.score).toBeLessThan(100);
    expect(types).toContain('redundant-tool-call');
    expect(types).toContain('large-tool-output');
    expect(types).toContain('tool-output-dominates-trace');
    expect(types).toContain('low-cache-reuse');
    expect(formatTraceEfficiencyAudit(audit)).toContain('ContextForge trace efficiency audit: warn');
    expect(createTraceEfficiencySummary(audit)).toContain('# ContextForge Trace Efficiency Audit');
    expect(createTraceEfficiencySummary(audit)).toContain('| redundant-tool-call | medium | session.jsonl |');
  });

  it('passes concise traces with specific tool calls and cache reuse', () => {
    const audit = auditTraceEfficiency([
      record({ content: 'git status --short', outputTokens: 80, cachedTokens: 300 }),
      record({ content: 'pnpm test tests/usage.test.ts', outputTokens: 300, cachedTokens: 400 }),
      record({ kind: 'assistant', content: 'summary', inputTokens: 600, outputTokens: 200, cachedTokens: 300, toolName: undefined })
    ]);

    expect(audit.status).toBe('pass');
    expect(audit.findings).toHaveLength(0);
    expect(audit.score).toBe(100);
  });
});
