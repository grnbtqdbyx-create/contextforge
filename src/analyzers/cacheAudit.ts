import type { CacheAudit, Finding, SessionRecord } from '../types.js';

const VOLATILE_PATTERNS = [
  /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}/,
  /\btimestamp\b/i,
  /\bgenerated at\b/i,
  /\bcurrent date\b/i
];

export function auditCacheStability(records: SessionRecord[]): CacheAudit {
  const findings: Finding[] = [];
  const inputTokens = records.reduce((sum, record) => sum + record.inputTokens, 0);
  const cachedTokens = records.reduce((sum, record) => sum + record.cachedTokens, 0);

  for (const record of records) {
    if (VOLATILE_PATTERNS.some((pattern) => pattern.test(record.content))) {
      findings.push({
        type: 'volatile-prefix',
        severity: 'high',
        message: `${record.provider} record includes volatile text that can destabilize prompt-cache prefixes.`,
        suggestion: 'Move timestamps and changing request metadata after stable cached context blocks.'
      });
    }
    if (record.kind === 'tool' && (record.outputTokens > 5000 || record.content.length > 5000)) {
      findings.push({
        type: 'large-tool-output',
        severity: 'high',
        message: 'Large tool output can crowd context and make cache reuse less valuable.',
        suggestion: 'Summarize logs, keep only failing excerpts, and store full artifacts outside prompt context.'
      });
    }
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 25 : 10), 0);
  return {
    findings: uniqueFindings,
    score: Math.max(0, 100 - penalty),
    cacheHitRatio: inputTokens === 0 ? 0 : cachedTokens / inputTokens,
    cachedTokens,
    inputTokens
  };
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.type}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

