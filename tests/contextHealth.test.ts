import { describe, expect, it } from 'vitest';
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
});
