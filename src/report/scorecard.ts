import type { AuditResult } from '../audit/buildAudit.js';
import type { DoctorResult } from '../doctor/doctor.js';

export interface AgentReadinessScorecardData {
  status: 'pass' | 'warn' | 'fail';
  agentReadinessScore: number;
  scores: {
    contextHealth: number;
    cacheStability: number;
    contextSecurity: number;
    cacheHitRatio: number;
  };
  sessionRecordCount: number;
  doctorChecks: Array<{ name: string; status: string; detail: string }>;
  topActions: string[];
  artifacts: string[];
}

export function createAgentReadinessScorecardData(options: { doctor: DoctorResult; audit: AuditResult }): AgentReadinessScorecardData {
  const { doctor, audit } = options;
  return {
    status: scorecardStatus(doctor, audit),
    agentReadinessScore: Math.round((audit.scores.contextHealth + audit.scores.cacheStability + audit.scores.contextSecurity) / 3),
    scores: {
      contextHealth: audit.scores.contextHealth,
      cacheStability: audit.scores.cacheStability,
      contextSecurity: audit.scores.contextSecurity,
      cacheHitRatio: audit.scores.cacheHitRatio
    },
    sessionRecordCount: audit.summary.recordCount,
    doctorChecks: doctor.checks,
    topActions: topActions(doctor, audit),
    artifacts: [
      'contextforge-scorecard.md',
      'contextforge-proof-pack.md',
      'contextforge-review-kit.md',
      'contextforge-artifact-map.md',
      'contextforge-agent-plan.md'
    ]
  };
}

export function createAgentReadinessScorecard(data: AgentReadinessScorecardData): string {
  const lines = [
    '# ContextForge Agent Readiness Scorecard',
    '',
    'A one-screen snapshot for maintainers, reviewers, and coding agents deciding whether this repository is ready for Codex or Claude Code.',
    '',
    '## At A Glance',
    '',
    '| Signal | Status | Detail |',
    '| --- | --- | --- |',
    `| Agent readiness score | ${data.agentReadinessScore}/100 | overall ${data.status} |`,
    `| Context health | ${data.scores.contextHealth}/100 | repo instructions are concise, discoverable, and scoped |`,
    `| Cache stability | ${data.scores.cacheStability}/100 | ${cacheDetail(data)} |`,
    `| Context security | ${data.scores.contextSecurity}/100 | repo context checked for injection, exfiltration, unsafe shell, and hidden directives |`,
    '',
    '## Public Surface Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...data.doctorChecks.map((check) => `| ${escapeTableCell(check.name)} | ${check.status} | ${escapeTableCell(check.detail)} |`),
    '',
    '## Why Codex And Claude Should Care',
    '',
    '- They can start from a small, current readiness snapshot instead of reading every generated artifact first.',
    '- They can jump to the proof pack for evidence, the review kit for changed-file focus, or the action plan for fixes.',
    '- They can see whether repo instructions, cache behavior, and context security are healthy before spending a long session.',
    '',
    '## Next Best Actions',
    '',
    ...data.topActions.map((action) => `- ${escapeMarkdown(action)}`),
    '',
    '## Evidence Commands',
    '',
    '```bash',
    'contextforge scorecard --output contextforge-scorecard.md',
    'contextforge proof-pack --output contextforge-proof-pack.md',
    'contextforge review-kit --base main --output contextforge-review-kit.md',
    'contextforge artifact-map --output contextforge-artifact-map.md',
    '```',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function scorecardStatus(doctor: DoctorResult, audit: AuditResult): 'pass' | 'warn' | 'fail' {
  if (doctor.status === 'fail' || audit.status === 'fail') return 'fail';
  if (doctor.status === 'warn') return 'warn';
  return 'pass';
}

function topActions(doctor: DoctorResult, audit: AuditResult): string[] {
  if (doctor.status === 'pass' && audit.status === 'pass') {
    return ['Keep the scorecard, proof pack, review kit, and artifact map current before the next public launch.'];
  }
  const actions = [...doctor.nextActions, ...audit.nextActions];
  return actions.length > 0 ? [...new Set(actions)].slice(0, 5) : ['Keep the scorecard, proof pack, review kit, and artifact map current before the next public launch.'];
}

function cacheDetail(data: AgentReadinessScorecardData): string {
  if (data.sessionRecordCount === 0) return 'repo-first run with no local sessions scanned';
  return `${(data.scores.cacheHitRatio * 100).toFixed(1)}% observed cache hit ratio from ${data.sessionRecordCount} records`;
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}
