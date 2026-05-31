import { readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { createSarifReport } from '../src/report/sarifReport.js';

const execFileAsync = promisify(execFile);

describe('SARIF report', () => {
  it('converts file-backed context findings to GitHub Code Scanning SARIF', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/security-project',
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 80
    });

    const sarif = createSarifReport(audit);
    const run = sarif.runs[0];

    expect(sarif.version).toBe('2.1.0');
    expect(run.tool.driver.name).toBe('ContextForge');
    expect(run.tool.driver.rules.some((rule) => rule.id === 'context-security/prompt-injection')).toBe(true);
    expect(run.results.some((result) => result.ruleId === 'context-security/prompt-injection')).toBe(true);
    expect(
      run.results.some((result) =>
        result.locations.some((location) => location.physicalLocation.artifactLocation.uri === 'AGENTS.md')
      )
    ).toBe(true);
  });

  it('writes SARIF from the audit CLI when requested', async () => {
    const output = 'contextforge-test.sarif';
    await rm(output, { force: true });
    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--sarif',
      output,
      '--output',
      'contextforge-test-audit.json',
      '--report',
      'contextforge-test-report.html'
    ]);

    const sarif = JSON.parse(await readFile(output, 'utf8')) as { version: string; runs: unknown[] };

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs.length).toBe(1);
    await rm(output, { force: true });
    await rm('contextforge-test-audit.json', { force: true });
    await rm('contextforge-test-report.html', { force: true });
  });
});
