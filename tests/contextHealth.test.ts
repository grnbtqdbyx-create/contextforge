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
});
