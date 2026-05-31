import { describe, expect, it } from 'vitest';
import { auditContextSecurity } from '../src/analyzers/contextSecurity.js';
import { buildAudit } from '../src/audit/buildAudit.js';

describe('context security audit', () => {
  it('detects prompt injection, exfiltration, unsafe shell, and hidden directives', async () => {
    const audit = await auditContextSecurity({ rootDir: 'fixtures/security-project' });

    expect(audit.score).toBeLessThan(50);
    expect(audit.findings.some((finding) => finding.type === 'prompt-injection')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'data-exfiltration')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'unsafe-shell')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'hidden-directive')).toBe(true);
  });

  it('appears in the full audit result and can fail a security threshold', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/security-project',
      minContextScore: 0,
      minCacheScore: 0,
      minSecurityScore: 80
    });

    expect(audit.status).toBe('fail');
    expect(audit.scores.contextSecurity).toBeLessThan(80);
    expect(audit.findings.security.length).toBeGreaterThan(0);
    expect(audit.failures.some((failure) => failure.includes('Context security'))).toBe(true);
  });
});
