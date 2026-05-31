import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { createActionPlan } from '../src/report/actionPlan.js';

const execFileAsync = promisify(execFile);

describe('agent action plan', () => {
  it('turns audit results into prioritized agent-readable next steps', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/security-project',
      minContextScore: 70,
      minCacheScore: 70,
      minSecurityScore: 70
    });
    const plan = createActionPlan(audit);

    expect(plan).toContain('# ContextForge Agent Action Plan');
    expect(plan).toContain('## Priority Queue');
    expect(plan).toContain('Context security');
    expect(plan).toContain('unsafe-shell');
    expect(plan).toContain('## Suggested Commands');
    expect(plan).toContain('contextforge audit');
    expect(plan).toContain('contextforge pack --task');
  });

  it('writes an action plan from the CLI', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-plan-'));
    const outputPath = path.join(rootDir, 'agent-plan.md');
    const { stdout } = await execFileAsync('pnpm', [
      'contextforge',
      'plan',
      '--demo',
      '--output',
      outputPath
    ]);
    const plan = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(plan).toContain('# ContextForge Agent Action Plan');
    expect(plan).toContain('## Handoff Prompt');
  });

  it('can write an action plan alongside audit outputs', async () => {
    const planPath = 'contextforge-test-agent-plan.md';
    const auditPath = 'contextforge-test-audit.json';
    const reportPath = 'contextforge-test-report.html';
    await rm(planPath, { force: true });
    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--output',
      auditPath,
      '--report',
      reportPath,
      '--plan',
      planPath
    ]);
    const plan = await readFile(planPath, 'utf8');

    expect(plan).toContain('# ContextForge Agent Action Plan');
    expect(plan).toContain('## Suggested Commands');
    await rm(planPath, { force: true });
    await rm(auditPath, { force: true });
    await rm(reportPath, { force: true });
  });
});
