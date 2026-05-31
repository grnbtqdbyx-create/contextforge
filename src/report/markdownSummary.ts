import type { AuditResult } from '../audit/buildAudit.js';
import type { Finding } from '../types.js';

export function createMarkdownSummary(audit: AuditResult): string {
  const lines = [
    '# ContextForge Audit Summary',
    '',
    `**Status:** ${audit.status}`,
    '',
    '## Scores',
    '',
    '| Signal | Score |',
    '| --- | ---: |',
    `| Context health | ${audit.scores.contextHealth}/100 |`,
    `| Cache stability | ${audit.scores.cacheStability}/100 |`,
    `| Context security | ${audit.scores.contextSecurity}/100 |`,
    `| Cache hit ratio | ${(audit.scores.cacheHitRatio * 100).toFixed(1)}% |`,
    '',
    '## Failures',
    ''
  ];

  if (audit.failures.length === 0) {
    lines.push('- None');
  } else {
    for (const failure of audit.failures) lines.push(`- ${escapeMarkdown(failure)}`);
  }

  lines.push('', '## Top Findings', '');
  const findings = topFindings(audit);
  if (findings.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of findings) {
      const location = finding.file ? ` in \`${finding.file}\`` : '';
      lines.push(`- **${finding.severity} ${finding.type}**${location}: ${escapeMarkdown(finding.message)}`);
    }
  }

  lines.push('', '## Next Actions', '');
  if (audit.nextActions.length === 0) {
    lines.push('- No next actions.');
  } else {
    for (const action of audit.nextActions.slice(0, 5)) lines.push(`- ${escapeMarkdown(action)}`);
  }

  return `${lines.join('\n')}\n`;
}

function topFindings(audit: AuditResult): Finding[] {
  return [
    ...audit.findings.security,
    ...audit.findings.context,
    ...audit.findings.cache
  ].slice(0, 8);
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}
