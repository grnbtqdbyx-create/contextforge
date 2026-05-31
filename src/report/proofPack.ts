import type { AuditResult } from '../audit/buildAudit.js';
import type { DoctorResult } from '../doctor/doctor.js';

export function createProofPack(options: { doctor: DoctorResult; audit: AuditResult }): string {
  const { doctor, audit } = options;
  const lines = [
    '# ContextForge Proof Pack',
    '',
    'A deterministic evidence bundle for maintainers, contributors, and coding agents evaluating whether this repository is ready for Codex or Claude Code.',
    '',
    '## Readiness Snapshot',
    '',
    '| Signal | Status | Detail |',
    '| --- | --- | --- |',
    `| Doctor | ${doctor.status} | ${doctor.checks.length} readiness checks |`,
    `| Audit | ${audit.status} | context ${audit.scores.contextHealth}/100, cache ${audit.scores.cacheStability}/100, security ${audit.scores.contextSecurity}/100 |`,
    `| Sessions | ${audit.summary.recordCount} records | ${audit.summary.totalTokens} total tokens, ${(audit.scores.cacheHitRatio * 100).toFixed(1)}% cache hit ratio |`,
    '',
    '## Doctor Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...doctor.checks.map((check) => `| ${escapeTableCell(check.name)} | ${check.status} | ${escapeTableCell(check.detail)} |`),
    '',
    '## Top Actions',
    '',
    ...topActions(doctor, audit).map((action) => `- ${escapeMarkdown(action)}`),
    '',
    '## Evidence Commands',
    '',
    '```bash',
    'contextforge doctor --summary contextforge-doctor.md',
    'contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg',
    'contextforge security-benchmark',
    'contextforge pack --task "next change" --budget 20000 --sessions',
    '```',
    '',
    '## Codex / Claude Handoff',
    '',
    'Start by reading this proof pack, then inspect `contextforge-agent-plan.md` and the top doctor action before editing. Keep the change scoped, rerun the evidence commands, and update the proof pack when the result changes.',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function topActions(doctor: DoctorResult, audit: AuditResult): string[] {
  const actions = [...doctor.nextActions, ...audit.nextActions];
  return actions.length > 0 ? [...new Set(actions)].slice(0, 6) : ['No immediate actions. Keep proof artifacts current before the next public launch.'];
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}
