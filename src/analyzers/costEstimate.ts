import type { Provider, SessionRecord } from '../types.js';

export interface CostPrices {
  inputPerMTok?: number;
  cachedInputPerMTok?: number;
  outputPerMTok?: number;
}

export interface CostBucket {
  records: number;
  inputTokens: number;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalUsd: number;
}

export interface CostEstimate extends CostBucket {
  priced: boolean;
  prices: Required<CostPrices>;
  byProvider: Record<Provider, CostBucket>;
  byProject: Record<string, CostBucket>;
  nextActions: string[];
}

function emptyBucket(): CostBucket {
  return {
    records: 0,
    inputTokens: 0,
    uncachedInputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalUsd: 0
  };
}

export function estimateSessionCost(records: SessionRecord[], prices: CostPrices): CostEstimate {
  const normalizedPrices = {
    inputPerMTok: prices.inputPerMTok ?? 0,
    cachedInputPerMTok: prices.cachedInputPerMTok ?? 0,
    outputPerMTok: prices.outputPerMTok ?? 0
  };
  const estimate: CostEstimate = {
    ...emptyBucket(),
    priced: Object.values(normalizedPrices).some((price) => price > 0),
    prices: normalizedPrices,
    byProvider: { codex: emptyBucket(), claude: emptyBucket() },
    byProject: {},
    nextActions: []
  };

  for (const record of records) {
    addRecord(estimate, record, normalizedPrices);
    addRecord(estimate.byProvider[record.provider], record, normalizedPrices);
    estimate.byProject[record.project] ??= emptyBucket();
    addRecord(estimate.byProject[record.project], record, normalizedPrices);
  }

  estimate.nextActions = nextActions(estimate);
  return estimate;
}

export function formatCostEstimate(estimate: CostEstimate): string {
  const lines = [
    `ContextForge cost estimate: ${estimate.priced ? 'priced' : 'unpriced'}`,
    `Records: ${estimate.records}`,
    `Input tokens: ${estimate.inputTokens}`,
    `Cached input tokens: ${estimate.cachedInputTokens}`,
    `Uncached input tokens: ${estimate.uncachedInputTokens}`,
    `Output tokens: ${estimate.outputTokens}`,
    `Total tokens: ${estimate.totalTokens}`,
    `Total estimated cost: ${formatUsd(estimate.totalUsd)}`,
    'Price inputs:',
    `- input: ${formatPrice(estimate.prices.inputPerMTok)} per 1M tokens`,
    `- cached input: ${formatPrice(estimate.prices.cachedInputPerMTok)} per 1M tokens`,
    `- output: ${formatPrice(estimate.prices.outputPerMTok)} per 1M tokens`,
    'Next actions:',
    ...estimate.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createCostEstimateSummary(estimate: CostEstimate): string {
  const lines = [
    '# ContextForge Cost Estimate',
    '',
    `Status: **${estimate.priced ? 'priced' : 'unpriced'}**`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Records | ${estimate.records} |`,
    `| Input tokens | ${estimate.inputTokens} |`,
    `| Cached input tokens | ${estimate.cachedInputTokens} |`,
    `| Uncached input tokens | ${estimate.uncachedInputTokens} |`,
    `| Output tokens | ${estimate.outputTokens} |`,
    `| Total tokens | ${estimate.totalTokens} |`,
    `| Total estimated cost | ${formatUsd(estimate.totalUsd)} |`,
    '',
    '## Price Inputs',
    '',
    '| Token class | USD per 1M tokens |',
    '| --- | --- |',
    `| Input | ${formatPrice(estimate.prices.inputPerMTok)} |`,
    `| Cached input | ${formatPrice(estimate.prices.cachedInputPerMTok)} |`,
    `| Output | ${formatPrice(estimate.prices.outputPerMTok)} |`,
    '',
    '## By Provider',
    '',
    '| Provider | Records | Tokens | Estimated cost |',
    '| --- | --- | --- | --- |',
    ...Object.entries(estimate.byProvider).map(([provider, bucket]) => `| ${provider} | ${bucket.records} | ${bucket.totalTokens} | ${formatUsd(bucket.totalUsd)} |`),
    '',
    '## By Project',
    '',
    '| Project | Records | Tokens | Estimated cost |',
    '| --- | --- | --- | --- |',
    ...Object.entries(estimate.byProject).map(([project, bucket]) => `| ${escapeTableCell(project)} | ${bucket.records} | ${bucket.totalTokens} | ${formatUsd(bucket.totalUsd)} |`),
    ...(Object.keys(estimate.byProject).length === 0 ? ['| none | 0 | 0 | $0.0000 |'] : []),
    '',
    '## Next Actions',
    '',
    ...estimate.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

function addRecord(bucket: CostBucket, record: SessionRecord, prices: Required<CostPrices>): void {
  const cachedInputTokens = Math.min(record.cachedTokens, record.inputTokens);
  const uncachedInputTokens = Math.max(0, record.inputTokens - cachedInputTokens);
  bucket.records += 1;
  bucket.inputTokens += record.inputTokens;
  bucket.cachedInputTokens += cachedInputTokens;
  bucket.uncachedInputTokens += uncachedInputTokens;
  bucket.outputTokens += record.outputTokens;
  bucket.totalTokens += record.inputTokens + record.outputTokens;
  bucket.totalUsd +=
    (uncachedInputTokens / 1_000_000) * prices.inputPerMTok +
    (cachedInputTokens / 1_000_000) * prices.cachedInputPerMTok +
    (record.outputTokens / 1_000_000) * prices.outputPerMTok;
}

function nextActions(estimate: CostEstimate): string[] {
  if (!estimate.priced) return ['Set price flags to estimate spend without hardcoding volatile provider pricing.'];
  if (estimate.records === 0) return ['Run with --demo, --codex, or --claude when session records are intentionally available.'];
  const actions = ['Compare this estimate with `contextforge trace-audit` before another long agent run.'];
  if (estimate.cachedInputTokens === 0 && estimate.inputTokens > 0) actions.push('Investigate prompt-cache misses when all observed input tokens are uncached.');
  return actions;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatPrice(value: number): string {
  return value > 0 ? `$${value.toFixed(4)}` : 'not set';
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
