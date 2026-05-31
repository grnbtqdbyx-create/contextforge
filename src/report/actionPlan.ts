import type { AuditResult } from '../audit/buildAudit.js';
import type { Finding } from '../types.js';

export function createActionPlan(audit: AuditResult): string {
  const findings = prioritizedFindings(audit);
  const lines = [
    '# ContextForge Agent Action Plan',
    '',
    `Generated: ${audit.generatedAt}`,
    `Status: **${audit.status}**`,
    '',
    '## Scoreboard',
    '',
    '| Signal | Score |',
    '| --- | ---: |',
    `| Context health | ${audit.scores.contextHealth}/100 |`,
    `| Cache stability | ${audit.scores.cacheStability}/100 |`,
    `| Context security | ${audit.scores.contextSecurity}/100 |`,
    `| Cache hit ratio | ${(audit.scores.cacheHitRatio * 100).toFixed(1)}% |`,
    '',
    '## Priority Queue',
    ''
  ];

  if (findings.length === 0) {
    lines.push('1. No blocking findings. Keep context files concise and rerun the audit before major PRs.');
  } else {
    findings.slice(0, 10).forEach((finding, index) => {
      const location = finding.file ? ` in \`${finding.file}\`` : '';
      lines.push(`${index + 1}. **${finding.signal}: ${escapeMarkdown(finding.severity)} ${escapeMarkdown(finding.type)}**${location}`);
      lines.push(`   - Problem: ${escapeMarkdown(finding.message)}`);
      lines.push(`   - Fix: ${escapeMarkdown(finding.suggestion)}`);
    });
  }

  lines.push(
    '',
    '## Suggested Commands',
    '',
    '```bash',
    'contextforge audit --min-context-score 70 --min-cache-score 70 --min-security-score 70 --summary contextforge-summary.md',
    'contextforge pack --task "fix the top ContextForge audit finding" --budget 20000',
    'contextforge plan --output contextforge-agent-plan.md',
    '```',
    '',
    '## Handoff Prompt',
    '',
    'Use this prompt with Codex or Claude after generating the plan:',
    '',
    '```text',
    'Read contextforge-agent-plan.md, fix the highest-priority finding first, keep the change scoped, run the suggested verification commands, and update the plan if the audit result changes.',
    '```',
    '',
    '## Failures',
    ''
  );

  if (audit.failures.length === 0) {
    lines.push('- None');
  } else {
    for (const failure of audit.failures) lines.push(`- ${escapeMarkdown(failure)}`);
  }

  lines.push('', '## Raw Next Actions', '');
  if (audit.nextActions.length === 0) {
    lines.push('- No generated next actions.');
  } else {
    for (const action of audit.nextActions.slice(0, 8)) lines.push(`- ${escapeMarkdown(action)}`);
  }

  return `${lines.join('\n')}\n`;
}

type FindingWithSignal = Finding & { signal: 'Context health' | 'Cache stability' | 'Context security' };

function prioritizedFindings(audit: AuditResult): FindingWithSignal[] {
  return [
    ...audit.findings.security.map((finding) => ({ ...finding, signal: 'Context security' as const })),
    ...audit.findings.context.map((finding) => ({ ...finding, signal: 'Context health' as const })),
    ...audit.findings.cache.map((finding) => ({ ...finding, signal: 'Cache stability' as const }))
  ].sort((left, right) => severityRank(right.severity) - severityRank(left.severity));
}

function severityRank(severity: Finding['severity']): number {
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}
