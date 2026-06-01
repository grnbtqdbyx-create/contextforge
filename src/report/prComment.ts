import type { AuditResult } from '../audit/buildAudit.js';
import type { Finding } from '../types.js';
import type { AgentSurfaceDiff, AgentSurfaceDiffChange } from './agentSurfaceDiff.js';

export interface PrCommentOptions {
  surfaceDiff?: AgentSurfaceDiff;
}

export function createPrComment(audit: AuditResult, options: PrCommentOptions = {}): string {
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

  lines.push('', '### Changed Agent Surfaces', '');
  if (!options.surfaceDiff || options.surfaceDiff.totalChangedSurfaces === 0) {
    lines.push('- None detected. Open `contextforge-agent-surface-diff.md` for the full branch scan.');
  } else {
    lines.push(
      `- ${options.surfaceDiff.totalChangedSurfaces} changed surface${options.surfaceDiff.totalChangedSurfaces === 1 ? '' : 's'} across ${
        options.surfaceDiff.affectedEcosystems.join(', ') || 'no detected ecosystems'
      }.`
    );
    for (const change of options.surfaceDiff.changes.slice(0, 4)) lines.push(`- **${change.action}** ${formatChangedPath(change)} (${change.ecosystem})`);
    if (options.surfaceDiff.changes.length > 4) lines.push(`- ${options.surfaceDiff.changes.length - 4} more changed surfaces in \`contextforge-agent-surface-diff.md\`.`);
  }

  lines.push(
    '',
    '### Artifacts',
    '',
    '- `contextforge-audit.json` for machine-readable gates',
    '- `contextforge-report.html` for the full report',
    '- `contextforge-agent-plan.md` for Codex/Claude handoff',
    '- `contextforge-proof-pack.md` for shareable doctor/audit proof',
    '- `contextforge-review-kit.md` for Codex/Claude review focus',
    '- `contextforge-agent-surface-diff.md` for changed agent-readable surfaces',
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

function formatChangedPath(change: AgentSurfaceDiffChange): string {
  if (change.previousPath) return `\`${escapeMarkdown(change.previousPath)}\` -> \`${escapeMarkdown(change.path)}\``;
  return `\`${escapeMarkdown(change.path)}\``;
}
