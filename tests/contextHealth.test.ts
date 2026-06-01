import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditContextFiles } from '../src/analyzers/contextHealth.js';

describe('context health audit', () => {
  it('flags vague and repeated repo-level instructions', async () => {
    const audit = await auditContextFiles({ rootDir: 'fixtures/project' });
    expect(audit.files.length).toBeGreaterThan(0);
    expect(audit.score).toBeLessThan(100);
    expect(audit.findings.some((finding) => finding.type === 'repetition')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'vague')).toBe(true);
  });

  it('discovers nested agent instruction files in monorepos', async () => {
    const audit = await auditContextFiles({ rootDir: 'fixtures/monorepo-project' });

    expect(audit.files.some((file) => file.path === 'AGENTS.md')).toBe(true);
    expect(audit.files.some((file) => file.path === 'packages/api/AGENTS.md')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === 'packages/api/AGENTS.md' && finding.type === 'vague')).toBe(true);
  });

  it('audits GitHub Copilot instruction files as repo context', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-health-'));
    await mkdir(path.join(rootDir, '.github/instructions'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/copilot-instructions.md'), 'Always be careful. Always be careful.\n');
    await writeFile(path.join(rootDir, '.github/instructions/frontend.instructions.md'), 'Use best practices perfectly.\n');

    const audit = await auditContextFiles({ rootDir });

    expect(audit.files.map((file) => file.path)).toEqual([
      '.github/copilot-instructions.md',
      '.github/instructions/frontend.instructions.md'
    ]);
    expect(audit.findings.some((finding) => finding.file === '.github/copilot-instructions.md' && finding.type === 'repetition')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === '.github/instructions/frontend.instructions.md' && finding.type === 'vague')).toBe(true);
  });
});
