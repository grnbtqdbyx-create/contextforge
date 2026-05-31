import { access } from 'node:fs/promises';
import path from 'node:path';
import { buildAudit } from '../audit/buildAudit.js';
import { runSecurityBenchmark } from '../benchmark/securityBenchmark.js';
import type { SessionRecord } from '../types.js';

export type DoctorStatus = 'pass' | 'warn' | 'fail';

export interface DoctorOptions {
  rootDir: string;
  records: SessionRecord[];
  benchmarkDir?: string;
  minContextScore?: number;
  minCacheScore?: number;
  minSecurityScore?: number;
}

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail: string;
}

export interface DoctorResult {
  status: DoctorStatus;
  checks: DoctorCheck[];
  nextActions: string[];
}

export async function runDoctor(options: DoctorOptions): Promise<DoctorResult> {
  const audit = await buildAudit({
    records: options.records,
    rootDir: options.rootDir,
    minContextScore: options.minContextScore ?? 60,
    minCacheScore: options.minCacheScore ?? 60,
    minSecurityScore: options.minSecurityScore ?? 60
  });
  const benchmark = await runSecurityBenchmark({ benchmarkDir: options.benchmarkDir });
  const workflows = await workflowChecks(options.rootDir);

  const checks: DoctorCheck[] = [
    {
      name: 'Context health',
      status: audit.scores.contextHealth >= (options.minContextScore ?? 60) ? 'pass' : 'fail',
      detail: `${audit.scores.contextHealth}/100 across repo context files`
    },
    {
      name: 'Cache stability',
      status: audit.scores.cacheStability >= (options.minCacheScore ?? 60) ? 'pass' : 'fail',
      detail:
        options.records.length > 0
          ? `${audit.scores.cacheStability}/100 from ${audit.summary.recordCount} session records`
          : `${audit.scores.cacheStability}/100 with no local sessions scanned`
    },
    {
      name: 'Context security',
      status: audit.scores.contextSecurity >= (options.minSecurityScore ?? 60) ? 'pass' : 'fail',
      detail: `${audit.scores.contextSecurity}/100 from repo instruction files`
    },
    {
      name: 'Security benchmark',
      status: benchmark.passed ? 'pass' : 'fail',
      detail: `${benchmark.totalCases - benchmark.failedCases}/${benchmark.totalCases} benchmark cases passing`
    },
    {
      name: 'GitHub workflows',
      status: workflows.missing.length === 0 ? 'pass' : 'warn',
      detail:
        workflows.present.length > 0
          ? `${workflows.present.join(', ')} present${workflows.missing.length > 0 ? `; missing ${workflows.missing.join(', ')}` : ''}`
          : `missing ${workflows.missing.join(', ')}`
    }
  ];

  return {
    status: overallStatus(checks),
    checks,
    nextActions: nextActions(checks, audit.nextActions)
  };
}

export function formatDoctor(result: DoctorResult): string {
  const lines = [`ContextForge doctor: ${result.status}`];
  for (const check of result.checks) {
    lines.push(`${check.name}: ${check.status} - ${check.detail}`);
  }
  lines.push('Next actions:');
  for (const action of result.nextActions) lines.push(`- ${action}`);
  return `${lines.join('\n')}\n`;
}

async function workflowChecks(rootDir: string): Promise<{ present: string[]; missing: string[] }> {
  const expected = [
    { label: 'ci.yml', file: '.github/workflows/ci.yml' },
    { label: 'contextforge-audit.yml', file: '.github/workflows/contextforge-audit.yml' }
  ];
  const results = await Promise.all(
    expected.map(async (workflow) => ({
      label: workflow.label,
      exists: await exists(path.join(rootDir, workflow.file))
    }))
  );
  return {
    present: results.filter((result) => result.exists).map((result) => result.label),
    missing: results.filter((result) => !result.exists).map((result) => result.label)
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function overallStatus(checks: DoctorCheck[]): DoctorStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

function nextActions(checks: DoctorCheck[], auditActions: string[]): string[] {
  const actions: string[] = [];
  if (checks.some((check) => check.name === 'GitHub workflows' && check.status === 'warn')) {
    actions.push('Add the ContextForge GitHub Action so every PR uploads JSON and HTML audit artifacts.');
  }
  actions.push(...auditActions.slice(0, 3));
  if (actions.length === 0) {
    actions.push('Run contextforge pack --task "your next change" to create a focused context pack before coding.');
  }
  return actions;
}
