import type { RecordKind, SessionRecord } from '../types.js';

export interface UsageBucket {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalTokens: number;
  records: number;
}

export interface UsageSummary extends UsageBucket {
  byProvider: Record<string, UsageBucket>;
  byProject: Record<string, UsageBucket>;
  byKind: Record<RecordKind, UsageBucket>;
  mostExpensive: SessionRecord[];
}

function emptyBucket(): UsageBucket {
  return { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, records: 0 };
}

function add(bucket: UsageBucket, record: SessionRecord): void {
  bucket.inputTokens += record.inputTokens;
  bucket.outputTokens += record.outputTokens;
  bucket.cachedTokens += record.cachedTokens;
  bucket.totalTokens += record.inputTokens + record.outputTokens;
  bucket.records += 1;
}

export function summarizeUsage(records: SessionRecord[]): UsageSummary {
  const summary: UsageSummary = {
    ...emptyBucket(),
    byProvider: {},
    byProject: {},
    byKind: {
      user: emptyBucket(),
      assistant: emptyBucket(),
      tool: emptyBucket(),
      file: emptyBucket(),
      system: emptyBucket(),
      unknown: emptyBucket()
    },
    mostExpensive: []
  };

  for (const record of records) {
    add(summary, record);
    summary.byProvider[record.provider] ??= emptyBucket();
    summary.byProject[record.project] ??= emptyBucket();
    add(summary.byProvider[record.provider], record);
    add(summary.byProject[record.project], record);
    add(summary.byKind[record.kind], record);
  }

  summary.mostExpensive = [...records]
    .sort((a, b) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens))
    .slice(0, 10);
  return summary;
}

