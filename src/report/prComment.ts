import type { AuditResult } from '../audit/buildAudit.js';
import type { Finding } from '../types.js';

export function createPrComment(audit: AuditResult): string {
  const lines = [
    '<!-- contextforge-pr-comment -->',
    '## ContextForge Agent Context Gate',
    '',
    `Status: **${audit.status}**`,
    '',
    '| Signal | Score |',
    '| --- | ---: |',
    `| Context health | ${audit.scores.contextHealth}/100 |`,
    `| Cache stability | ${audit.scores.cacheStability}/100 |`,
    `| Context security | ${audit.scores.contextSecurity}/100 |`,
    `| Cache hit ratio | ${(audit.scores.cacheHitRatio * 100).toFixed(1)}% |`,
    '',
    '### Failing Gates',
    ''
  ];

  if (audit.failures.length === 0) {
    lines.push('- None');
  } else {
    for (const failure of audit.failures.slice(0, 4)) lines.push(`- ${escapeMarkdown(failure)}`);
  }

  lines.push('', '### Top Agent Fixes', '');
  const findings = topFindings(audit);
  if (findings.length === 0) {
    lines.push('- No blocking findings. Keep context files concise and rerun ContextForge before major PRs.');
  } else {
    for (const finding of findings.slice(0, 4)) {
      const location = finding.file ? ` in \`${finding.file}\`` : '';
      lines.push(`- **${finding.severity} ${finding.type}**${location}: ${escapeMarkdown(finding.suggestion)}`);
    }
  }

  lines.push(
    '',
    '### Artifacts',
    '',
    '- `contextforge-audit.json` for machine-readable gates',
    '- `contextforge-report.html` for the full report',
    '- `contextforge-agent-plan.md` for Codex/Claude handoff',
    '',
    '_Generated deterministically by ContextForge. No model or secret-bearing agent is needed to produce this comment._'
  );

  return `${lines.join('\n')}\n`;
}

function topFindings(audit: AuditResult): Finding[] {
  return [
    ...audit.findings.security,
    ...audit.findings.context,
    ...audit.findings.cache
  ];
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}
