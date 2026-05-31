import { describe, expect, it } from 'vitest';
import { auditContextSecurity } from '../src/analyzers/contextSecurity.js';
import { buildAudit } from '../src/audit/buildAudit.js';
import { runSecurityBenchmark } from '../src/benchmark/securityBenchmark.js';

describe('context security audit', () => {
  it('detects prompt injection, exfiltration, unsafe shell, and hidden directives', async () => {
    const audit = await auditContextSecurity({ rootDir: 'fixtures/security-project' });

    expect(audit.score).toBeLessThan(50);
    expect(audit.findings.some((finding) => finding.type === 'prompt-injection')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'data-exfiltration')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'unsafe-shell')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'hidden-directive')).toBe(true);
  });

  it('detects malicious nested agent instruction files', async () => {
    const audit = await auditContextSecurity({ rootDir: 'fixtures/monorepo-project' });

    expect(
      audit.findings.some(
        (finding) => finding.file === 'packages/worker/AGENTS.md' && finding.type === 'prompt-injection'
      )
    ).toBe(true);
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

  it('runs the public malicious-context benchmark fixtures against expected findings and score ranges', async () => {
    const benchmark = await runSecurityBenchmark({ benchmarkDir: 'fixtures/security-benchmark' });

    expect(benchmark.passed).toBe(true);
    expect(benchmark.totalCases).toBe(3);
    expect(benchmark.failedCases).toBe(0);
    expect(benchmark.cases.map((benchmarkCase) => benchmarkCase.name)).toEqual([
      'benign-minimal',
      'suspicious-hidden-approval',
      'malicious-exfil-shell'
    ]);
    expect(benchmark.cases.find((benchmarkCase) => benchmarkCase.name === 'benign-minimal')?.actual.score).toBe(100);
    expect(benchmark.cases.find((benchmarkCase) => benchmarkCase.name === 'malicious-exfil-shell')?.actual.findingTypes).toEqual([
      'data-exfiltration',
      'hidden-directive',
      'permission-escalation',
      'prompt-injection',
      'unsafe-shell'
    ]);
  });
});
