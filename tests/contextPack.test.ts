import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createContextPack } from '../src/pack/contextPack.js';
import { scanCodexSessions } from '../src/scanners/codex.js';
import { estimateTokens } from '../src/tokenizers/index.js';
import type { SessionRecord } from '../src/types.js';

describe('context pack generator', () => {
  it('creates a budgeted pack and excludes secrets', async () => {
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'fix auth bug',
      budget: 300
    });
    expect(pack.files.some((file) => file.path.endsWith('src/auth.ts'))).toBe(true);
    expect(pack.content).not.toContain('sk-should-not-appear');
    expect(pack.estimatedTokens).toBeLessThanOrEqual(300);
  });

  it('keeps the final generated content inside the requested token budget', async () => {
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'fix auth bug',
      budget: 120
    });

    expect(estimateTokens(pack.content)).toBeLessThanOrEqual(120);
    expect(pack.estimatedTokens).toBe(estimateTokens(pack.content));
    expect(pack.budget.requestedTokens).toBe(120);
    expect(pack.budget.status).toBe('within-budget');
    expect(pack.content).toContain('## Budget Ledger');
    expect(pack.content).toContain('| Requested budget | 120 tokens |');
  });

  it('explains why each selected file was included', async () => {
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'fix auth bug',
      budget: 300
    });
    const authFile = pack.files.find((file) => file.path.endsWith('src/auth.ts'));

    expect(authFile?.reasons.some((reason) => reason.type === 'task-term-match')).toBe(true);
    expect(authFile?.reasons.some((reason) => reason.type === 'path-match')).toBe(true);
    expect(pack.content).toContain('Why included');
    expect(pack.content).toContain('task term');
  });

  it('uses session-derived failure, read, and edit signals as visible scoring reasons', async () => {
    const records: SessionRecord[] = [
      record('tool', 'Read tool opened file_path src/auth.ts before debugging'),
      record('assistant', 'Tests failed in src/auth.ts after the login regression.'),
      record('tool', 'Edit tool touched src/auth.ts to update the login check')
    ];

    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'investigate regression',
      budget: 300,
      records
    });
    const authFile = pack.files.find((file) => file.path === 'src/auth.ts');

    expect(authFile?.reasons.map((reason) => reason.type)).toEqual(
      expect.arrayContaining(['session-failure', 'session-read', 'session-edit'])
    );
    expect(pack.content).toContain('session failure mention');
    expect(pack.content).toContain('recent session read');
    expect(pack.content).toContain('recent session edit');
  });

  it('excludes generated ContextForge artifacts from packs', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contextforge-pack-test-'));
    await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(rootDir, 'src', 'auth.ts'), 'export function login() { return true; }\n');
    await fs.writeFile(
      path.join(rootDir, 'contextforge-pack.md'),
      'Generated contextforge-pack.md mentions auth but should not be repacked.\n'
    );

    const pack = await createContextPack({
      rootDir,
      task: 'fix auth bug',
      budget: 600
    });

    expect(pack.files.some((file) => file.path === 'contextforge-pack.md')).toBe(false);
  });

  it('uses modern Codex rollout records as session-derived context signals', async () => {
    const records = await scanCodexSessions({ rootDir: 'fixtures/codex-rollout' });
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'investigate login regression',
      budget: 300,
      records
    });
    const authFile = pack.files.find((file) => file.path === 'src/auth.ts');

    expect(authFile?.reasons.some((reason) => reason.type === 'session-failure')).toBe(true);
    expect(authFile?.reasons.some((reason) => reason.type === 'session-read')).toBe(true);
    expect(pack.content).toContain('session failure mention');
  });
});

function record(kind: SessionRecord['kind'], content: string): SessionRecord {
  return {
    provider: 'codex',
    source: 'fixtures/codex/session.jsonl',
    project: 'demo',
    kind,
    content,
    inputTokens: 100,
    outputTokens: 10,
    cachedTokens: 0
  };
}
