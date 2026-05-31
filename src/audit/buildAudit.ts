import { auditCacheStability } from '../analyzers/cacheAudit.js';
import { auditContextFiles } from '../analyzers/contextHealth.js';
import { summarizeUsage } from '../analyzers/usage.js';
import { suggestRuleImprovements } from '../improve/ruleSuggestions.js';
import type { Finding, SessionRecord } from '../types.js';

export interface AuditOptions {
  records: SessionRecord[];
  rootDir: string;
  minContextScore: number;
  minCacheScore: number;
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
    cacheHitRatio: number;
  };
  findings: {
    context: Finding[];
    cache: Finding[];
  };
  failures: string[];
  nextActions: string[];
}

export async function buildAudit(options: AuditOptions): Promise<AuditResult> {
  const usage = summarizeUsage(options.records);
  const context = await auditContextFiles({ rootDir: options.rootDir });
  const cache = auditCacheStability(options.records);
  const suggestions = suggestRuleImprovements({
    contextFindings: context.findings,
    cacheFindings: cache.findings
  });

  const failures: string[] = [];
  if (context.score < options.minContextScore) {
    failures.push(`Context health score ${context.score} is below minimum ${options.minContextScore}.`);
  }
  if (cache.score < options.minCacheScore) {
    failures.push(`Cache stability score ${cache.score} is below minimum ${options.minCacheScore}.`);
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
      cacheHitRatio: cache.cacheHitRatio
    },
    findings: {
      context: context.findings,
      cache: cache.findings
    },
    failures,
    nextActions: suggestions.map((suggestion) => suggestion.text)
  };
}
