import { describe, expect, it } from 'vitest';
import { scanClaudeSessions } from '../src/scanners/claude.js';
import { scanCodexSessions } from '../src/scanners/codex.js';

describe('session scanners', () => {
  it('parses Claude Code JSONL fixtures into normalized records', async () => {
    const records = await scanClaudeSessions({ demo: true });
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]?.provider).toBe('claude');
    expect(records.some((record) => record.kind === 'tool')).toBe(true);
  });

  it('parses Codex JSONL fixtures and preserves cached token details', async () => {
    const records = await scanCodexSessions({ demo: true });
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]?.provider).toBe('codex');
    expect(records.some((record) => record.cachedTokens > 0)).toBe(true);
  });
});
