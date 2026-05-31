import { buildAudit } from '../audit/buildAudit.js';
import { summarizeUsage } from '../analyzers/usage.js';
import { scanClaudeSessions } from '../scanners/claude.js';
import { scanCodexSessions } from '../scanners/codex.js';
import type { UsageBucket } from '../analyzers/usage.js';

export async function createDemoOutput(): Promise<string> {
  const records = [
    ...(await scanClaudeSessions({ demo: true })),
    ...(await scanCodexSessions({ demo: true }))
  ];
  const usage = summarizeUsage(records);
  const audit = await buildAudit({
    records,
    rootDir: 'fixtures/project',
    minContextScore: 70,
    minCacheScore: 70,
    minSecurityScore: 70
  });

  const lines = [
    '# ContextForge Demo Output',
    '',
    'This file is generated from deterministic fixture data so visitors can inspect the public output before installing the CLI.',
    '',
    '## Token Usage',
    '',
    '```bash',
    'contextforge usage --demo',
    '```',
    '',
    '```text',
    `Total tokens: ${usage.totalTokens}`,
    `Input: ${usage.inputTokens}  Output: ${usage.outputTokens}  Cached: ${usage.cachedTokens}`,
    'By kind',
    ...usageTable(usage.byKind),
    '```',
    '',
    '## CI Audit',
    '',
    '```bash',
    'contextforge audit --demo --min-context-score 70 --min-cache-score 70 --min-security-score 70 --summary contextforge-summary.md --plan contextforge-agent-plan.md',
    '```',
    '',
    '```text',
    `ContextForge audit: ${audit.status}`,
    `Context health: ${audit.scores.contextHealth}/100  Cache stability: ${audit.scores.cacheStability}/100  Context security: ${audit.scores.contextSecurity}/100`,
    `Cache hit ratio: ${(audit.scores.cacheHitRatio * 100).toFixed(1)}%`,
    '```',
    '',
    '## Agent Handoff',
    '',
    '```bash',
    'contextforge plan --demo --output contextforge-agent-plan.md',
    '```',
    '',
    '```text',
    'Read contextforge-agent-plan.md, fix the highest-priority finding first, keep the change scoped, run the suggested verification commands, and update the plan if the audit result changes.',
    '```',
    '',
    '## Why This Matters',
    '',
    '- Gives Codex and Claude a stable context budget before a coding session starts.',
    '- Turns token usage, prompt-cache stability, and context-file risk into CI gates.',
    '- Produces a compact handoff plan that another agent can follow without rereading the whole repository.'
  ];

  return `${lines.join('\n')}\n`;
}

function usageTable(table: Record<string, UsageBucket>): string[] {
  return Object.entries(table)
    .filter(([, bucket]) => bucket.records > 0)
    .map(([kind, bucket]) => `  ${kind.padEnd(10)} ${String(bucket.totalTokens).padStart(8)} tokens (${bucket.records} records)`);
}
