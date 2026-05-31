import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

  it('parses modern Codex rollout payload records without leaking fixture-specific assumptions', async () => {
    const records = await scanCodexSessions({ rootDir: 'fixtures/codex-rollout' });

    expect(records.some((record) => record.kind === 'system' && record.content.includes('codex_cli_rs'))).toBe(true);
    expect(records.some((record) => record.kind === 'user' && record.content.includes('src/auth.ts'))).toBe(true);
    expect(records.some((record) => record.kind === 'assistant' && record.content.includes('inspect src/auth.ts'))).toBe(true);
    expect(records.some((record) => record.kind === 'tool' && record.toolName === 'exec_command')).toBe(true);
    expect(records.some((record) => record.kind === 'tool' && record.content.includes('rejects valid login'))).toBe(true);
    expect(records.some((record) => record.inputTokens === 3000 && record.cachedTokens === 1200 && record.outputTokens === 800)).toBe(true);
  });

  it('bounds local session scans by recent file count and file size', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contextforge-codex-scan-'));
    await fs.writeFile(path.join(rootDir, '2026-05-01-old.jsonl'), '{"role":"user","content":"old session"}\n');
    await fs.writeFile(path.join(rootDir, '2026-05-31-new.jsonl'), '{"role":"user","content":"new session"}\n');
    await fs.writeFile(path.join(rootDir, '2026-06-01-huge.jsonl'), `${'x'.repeat(128)}\n`);

    const records = await scanCodexSessions({ rootDir, maxFiles: 2, maxFileBytes: 64 });

    expect(records.map((record) => record.content)).toEqual(['new session']);
  });
});
