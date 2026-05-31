import { auditCacheStability } from '../analyzers/cacheAudit.js';
import { auditContextFiles } from '../analyzers/contextHealth.js';
import { auditContextSecurity } from '../analyzers/contextSecurity.js';
import { summarizeUsage } from '../analyzers/usage.js';
import { suggestRuleImprovements } from '../improve/ruleSuggestions.js';
import type { Finding, SessionRecord } from '../types.js';

export interface AuditOptions {
  records: SessionRecord[];
  rootDir: string;
  minContextScore: number;
  minCacheScore: number;
  minSecurityScore?: number;
}

export interface AuditResult {
  status: 'pass' | 'fail';
  generatedAt: string;
  summary: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    recordCount: number;
  };
  scores: {
    contextHealth: number;
    cacheStability: number;
    contextSecurity: number;
    cacheHitRatio: number;
  };
  findings: {
    context: Finding[];
    cache: Finding[];
    security: Finding[];
  };
  failures: string[];
  nextActions: string[];
}

export async function buildAudit(options: AuditOptions): Promise<AuditResult> {
  const usage = summarizeUsage(options.records);
  const context = await auditContextFiles({ rootDir: options.rootDir });
  const cache = auditCacheStability(options.records);
  const security = await auditContextSecurity({ rootDir: options.rootDir });
  const suggestions = suggestRuleImprovements({
    contextFindings: [...context.findings, ...security.findings],
    cacheFindings: cache.findings
  });

  const failures: string[] = [];
  if (context.score < options.minContextScore) {
    failures.push(`Context health score ${context.score} is below minimum ${options.minContextScore}.`);
  }
  if (cache.score < options.minCacheScore) {
    failures.push(`Cache stability score ${cache.score} is below minimum ${options.minCacheScore}.`);
  }
  if (security.score < (options.minSecurityScore ?? 60)) {
    failures.push(`Context security score ${security.score} is below minimum ${options.minSecurityScore ?? 60}.`);
  }

  return {
    status: failures.length > 0 ? 'fail' : 'pass',
    generatedAt: new Date().toISOString(),
    summary: {
      totalTokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cachedTokens: usage.cachedTokens,
      recordCount: usage.records
    },
    scores: {
      contextHealth: context.score,
      cacheStability: cache.score,
      contextSecurity: security.score,
      cacheHitRatio: cache.cacheHitRatio
    },
    findings: {
      context: context.findings,
      cache: cache.findings,
      security: security.findings
    },
    failures,
    nextActions: suggestions.map((suggestion) => suggestion.text)
  };
}
