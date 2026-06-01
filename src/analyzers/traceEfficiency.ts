import os from 'node:os';
import path from 'node:path';
import type { Finding, SessionRecord } from '../types.js';

export type TraceEfficiencyStatus = 'pass' | 'warn';

export interface TraceEfficiencyAudit {
  status: TraceEfficiencyStatus;
  score: number;
  records: number;
  toolRecords: number;
  totalTokens: number;
  toolOutputTokens: number;
  cacheHitRatio: number;
  repeatedToolCalls: number;
  findings: Finding[];
  nextActions: string[];
}

const LARGE_TOOL_OUTPUT_TOKENS = 5000;
const LARGE_TOOL_OUTPUT_CHARS = 8000;
const LOW_CACHE_INPUT_TOKENS = 10000;
const TOOL_OUTPUT_DOMINANCE_TOKENS = 5000;
const TOOL_OUTPUT_DOMINANCE_RATIO = 0.5;

export function auditTraceEfficiency(records: SessionRecord[]): TraceEfficiencyAudit {
  const findings: Finding[] = [];
  const totalInputTokens = sum(records, (record) => record.inputTokens);
  const totalOutputTokens = sum(records, (record) => record.outputTokens);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const cachedTokens = sum(records, (record) => record.cachedTokens);
  const toolRecords = records.filter((record) => record.kind === 'tool');
  const toolOutputTokens = sum(toolRecords, (record) => record.outputTokens);

  findings.push(...findRedundantToolCalls(toolRecords));

  const largestToolOutput = toolRecords.find((record) => record.outputTokens > LARGE_TOOL_OUTPUT_TOKENS || record.content.length > LARGE_TOOL_OUTPUT_CHARS);
  if (largestToolOutput) {
    findings.push({
      type: 'large-tool-output',
      severity: 'high',
      file: displaySource(largestToolOutput.source),
      message: `${toolLabel(largestToolOutput)} produced a large tool output that can crowd the next agent turn.`,
      suggestion: 'Summarize or redirect bulky command output before feeding it back into the agent context.'
    });
  }

  const toolOutputRatio = totalTokens > 0 ? toolOutputTokens / totalTokens : 0;
  if (totalTokens >= TOOL_OUTPUT_DOMINANCE_TOKENS && toolOutputRatio >= TOOL_OUTPUT_DOMINANCE_RATIO) {
    findings.push({
      type: 'tool-output-dominates-trace',
      severity: 'medium',
      message: `Tool output accounts for ${(toolOutputRatio * 100).toFixed(1)}% of observed trace tokens.`,
      suggestion: 'Prefer focused commands, filtered logs, and artifact files when tool output dominates the trace.'
    });
  }

  const cacheHitRatio = totalInputTokens > 0 ? cachedTokens / totalInputTokens : 0;
  if (totalInputTokens >= LOW_CACHE_INPUT_TOKENS && cacheHitRatio < 0.1) {
    findings.push({
      type: 'low-cache-reuse',
      severity: 'medium',
      message: `Only ${(cacheHitRatio * 100).toFixed(1)}% of observed input tokens were cached across the trace.`,
      suggestion: 'Stabilize shared prefixes, avoid timestamped context, and keep reusable repo instructions concise.'
    });
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 25 : finding.severity === 'medium' ? 15 : 6), 0);
  const repeatedToolCalls = repeatedToolCallCount(toolRecords);
  return {
    status: uniqueFindings.length > 0 ? 'warn' : 'pass',
    score: Math.max(0, 100 - penalty),
    records: records.length,
    toolRecords: toolRecords.length,
    totalTokens,
    toolOutputTokens,
    cacheHitRatio,
    repeatedToolCalls,
    findings: uniqueFindings,
    nextActions: nextActions(uniqueFindings)
  };
}

export function formatTraceEfficiencyAudit(audit: TraceEfficiencyAudit): string {
  const lines = [
    `ContextForge trace efficiency audit: ${audit.status}`,
    `Score: ${audit.score}/100`,
    `Records: ${audit.records}  Tool records: ${audit.toolRecords}`,
    `Total tokens: ${audit.totalTokens}  Tool output tokens: ${audit.toolOutputTokens}`,
    `Cache hit ratio: ${(audit.cacheHitRatio * 100).toFixed(1)}%`,
    `Repeated tool calls: ${audit.repeatedToolCalls}`,
    'Findings:',
    ...(audit.findings.length > 0
      ? audit.findings.map((finding) => `- [${finding.severity}] ${finding.type}: ${finding.message}`)
      : ['- none']),
    'Next actions:',
    ...audit.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createTraceEfficiencySummary(audit: TraceEfficiencyAudit): string {
  const lines = [
    '# ContextForge Trace Efficiency Audit',
    '',
    `Status: **${audit.status}**`,
    '',
    `Score: **${audit.score}/100**`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Records | ${audit.records} |`,
    `| Tool records | ${audit.toolRecords} |`,
    `| Total tokens | ${audit.totalTokens} |`,
    `| Tool output tokens | ${audit.toolOutputTokens} |`,
    `| Cache hit ratio | ${(audit.cacheHitRatio * 100).toFixed(1)}% |`,
    `| Repeated tool calls | ${audit.repeatedToolCalls} |`,
    '',
    '| Type | Severity | Source | Message | Suggestion |',
    '| --- | --- | --- | --- | --- |',
    ...(audit.findings.length > 0
      ? audit.findings.map(
          (finding) =>
            `| ${escapeTableCell(finding.type)} | ${finding.severity} | ${escapeTableCell(finding.file ?? '')} | ${escapeTableCell(finding.message)} | ${escapeTableCell(finding.suggestion)} |`
        )
      : ['| none | low |  | No trace efficiency findings. | Keep tool calls focused and preserve cache-friendly context. |']),
    '',
    '## Next Actions',
    '',
    ...audit.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

function findRedundantToolCalls(toolRecords: SessionRecord[]): Finding[] {
  const groups = new Map<string, SessionRecord[]>();
  for (const record of toolRecords) {
    const key = `${record.provider}:${record.project}:${record.toolName ?? 'tool'}:${normalizeToolContent(record.content)}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const findings: Finding[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const first = group[0];
    findings.push({
      type: 'redundant-tool-call',
      severity: 'medium',
      file: displaySource(first.source),
      message: `${toolLabel(first)} repeated ${group.length} times with the same observed input.`,
      suggestion: 'Reuse the prior result or narrow the second command instead of repeating identical tool calls.'
    });
  }
  return findings;
}

function repeatedToolCallCount(toolRecords: SessionRecord[]): number {
  const counts = new Map<string, number>();
  for (const record of toolRecords) {
    const key = `${record.provider}:${record.project}:${record.toolName ?? 'tool'}:${normalizeToolContent(record.content)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function normalizeToolContent(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function toolLabel(record: SessionRecord): string {
  return record.toolName ? `${record.provider} ${record.toolName}` : `${record.provider} tool`;
}

function displaySource(source: string): string {
  const relative = path.relative(process.cwd(), source).split(path.sep).join('/');
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return relative;
  return source.replace(os.homedir(), '~').split(path.sep).join('/');
}

function nextActions(findings: Finding[]): string[] {
  if (findings.length === 0) return ['Keep trace output concise and cache-friendly before long Codex or Claude sessions.'];
  const actions = new Set<string>();
  for (const finding of findings) {
    if (finding.type === 'redundant-tool-call') actions.add('Remove repeated tool calls or cache their result in the handoff before rerunning.');
    if (finding.type.includes('tool-output')) actions.add('Filter, summarize, or redirect bulky tool output into artifacts instead of chat context.');
    if (finding.type === 'low-cache-reuse') actions.add('Stabilize reusable prompt prefixes and remove volatile timestamps from shared context.');
  }
  return [...actions];
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file ?? ''}:${finding.type}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sum(records: SessionRecord[], selector: (record: SessionRecord) => number): number {
  return records.reduce((total, record) => total + selector(record), 0);
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
