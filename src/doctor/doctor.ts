import { access } from 'node:fs/promises';
import path from 'node:path';
import { auditMcpExposure } from '../analyzers/mcpExposure.js';
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
  const mcpExposure = await auditMcpExposure({ rootDir: options.rootDir });
  const workflows = await workflowChecks(options.rootDir);
  const publicProof = await publicProofChecks(options.rootDir);
  const launchProfile = await launchProfileChecks(options.rootDir);
  const communityHealth = await communityHealthChecks(options.rootDir);

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
    },
    {
      name: 'Public proof surfaces',
      status: publicProof.missing.length === 0 ? 'pass' : 'warn',
      detail:
        publicProof.present.length > 0
          ? `${publicProof.present.join(', ')} present${publicProof.missing.length > 0 ? `; missing ${publicProof.missing.join(', ')}` : ''}`
          : `missing ${publicProof.missing.join(', ')}`
    },
    {
      name: 'Launch profile surfaces',
      status: launchProfile.missing.length === 0 ? 'pass' : 'warn',
      detail:
        launchProfile.present.length > 0
          ? `${launchProfile.present.join(', ')} present${launchProfile.missing.length > 0 ? `; missing ${launchProfile.missing.join(', ')}` : ''}`
          : `missing ${launchProfile.missing.join(', ')}`
    },
    {
      name: 'Community health surfaces',
      status: communityHealth.missing.length === 0 ? 'pass' : 'warn',
      detail:
        communityHealth.present.length > 0
          ? `${communityHealth.present.join(', ')} present${communityHealth.missing.length > 0 ? `; missing ${communityHealth.missing.join(', ')}` : ''}`
          : `missing ${communityHealth.missing.join(', ')}`
    },
    {
      name: 'MCP exposure',
      status: mcpExposure.status,
      detail:
        mcpExposure.files.length > 0
          ? `${mcpExposure.score}/100 across ${mcpExposure.files.join(', ')}${mcpExposure.findings.length > 0 ? `; ${mcpExposure.findings.length} findings` : ''}`
          : `${mcpExposure.score}/100 with no repo MCP configs found`
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

export function createDoctorSummary(result: DoctorResult): string {
  const lines = [
    '# ContextForge Doctor',
    '',
    `Status: **${result.status}**`,
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...result.checks.map((check) => `| ${escapeTableCell(check.name)} | ${check.status} | ${escapeTableCell(check.detail)} |`),
    '',
    '## Next Actions',
    '',
    ...result.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
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

async function publicProofChecks(rootDir: string): Promise<{ present: string[]; missing: string[] }> {
  const expected = [
    { label: 'README.md', file: 'README.md' },
    { label: 'LICENSE', file: 'LICENSE' },
    { label: 'CONTRIBUTING.md', file: 'CONTRIBUTING.md' },
    { label: 'CHANGELOG.md', file: 'CHANGELOG.md' },
    { label: 'llms.txt', file: 'llms.txt' },
    { label: 'llms-full.txt', file: 'llms-full.txt' },
    { label: 'examples/demo-output.md', file: 'examples/demo-output.md' },
    { label: 'examples/pr-comment.md', file: 'examples/pr-comment.md' },
    { label: 'examples/review-kit.md', file: 'examples/review-kit.md' }
  ];
  const results = await Promise.all(
    expected.map(async (surface) => ({
      label: surface.label,
      exists: await exists(path.join(rootDir, surface.file))
    }))
  );
  return {
    present: results.filter((result) => result.exists).map((result) => result.label),
    missing: results.filter((result) => !result.exists).map((result) => result.label)
  };
}

async function launchProfileChecks(rootDir: string): Promise<{ present: string[]; missing: string[] }> {
  const expected = [
    { label: 'demo-terminal.svg', file: 'assets/demo-terminal.svg' },
    { label: 'contextforge-report.png', file: 'assets/contextforge-report.png' },
    { label: 'docs/launch-post.md', file: 'docs/launch-post.md' },
    { label: 'docs/comparison.md', file: 'docs/comparison.md' },
    { label: 'docs/artifacts.md', file: 'docs/artifacts.md' }
  ];
  const results = await Promise.all(
    expected.map(async (surface) => ({
      label: surface.label,
      exists: await exists(path.join(rootDir, surface.file))
    }))
  );
  return {
    present: results.filter((result) => result.exists).map((result) => result.label),
    missing: results.filter((result) => !result.exists).map((result) => result.label)
  };
}

async function communityHealthChecks(rootDir: string): Promise<{ present: string[]; missing: string[] }> {
  const expected = [
    { label: 'CODE_OF_CONDUCT.md', file: 'CODE_OF_CONDUCT.md' },
    { label: 'SECURITY.md', file: 'SECURITY.md' },
    { label: 'bug_report.md', file: '.github/ISSUE_TEMPLATE/bug_report.md' },
    { label: 'feature_request.md', file: '.github/ISSUE_TEMPLATE/feature_request.md' },
    { label: 'PULL_REQUEST_TEMPLATE.md', file: '.github/PULL_REQUEST_TEMPLATE.md' }
  ];
  const results = await Promise.all(
    expected.map(async (surface) => ({
      label: surface.label,
      exists: await exists(path.join(rootDir, surface.file))
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
  if (checks.some((check) => check.name === 'MCP exposure' && check.status !== 'pass')) {
    actions.push('Review MCP configs for hardcoded secrets, unsafe shell installers, unpinned packages, auto-approval, broad tool permissions, and symlinked config files before enabling agents.');
  }
  if (checks.some((check) => check.name === 'Public proof surfaces' && check.status === 'warn')) {
    actions.push('Add README, license, contribution, changelog, demo, and LLM discovery surfaces so visitors and agents can verify the project quickly.');
  }
  if (checks.some((check) => check.name === 'Launch profile surfaces' && check.status === 'warn')) {
    actions.push('Add demo assets, launch kit, and comparison guide so visitors can understand and share the project quickly.');
  }
  if (checks.some((check) => check.name === 'Community health surfaces' && check.status === 'warn')) {
    actions.push('Add code of conduct, security policy, issue templates, and pull request template so contributors know how to collaborate safely.');
  }
  actions.push(...auditActions.slice(0, 3));
  if (actions.length === 0) {
    actions.push('Run contextforge pack --task "your next change" to create a focused context pack before coding.');
  }
  return actions;
}
