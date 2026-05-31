export type Provider = 'codex' | 'claude';

export type RecordKind = 'user' | 'assistant' | 'tool' | 'file' | 'system' | 'unknown';

export interface SessionRecord {
  provider: Provider;
  source: string;
  project: string;
  kind: RecordKind;
  content: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  timestamp?: string;
  toolName?: string;
}

export interface ScannerOptions {
  demo?: boolean;
  rootDir?: string;
  maxFiles?: number;
  maxFileBytes?: number;
}

export type Severity = 'low' | 'medium' | 'high';

export interface Finding {
  type: string;
  message: string;
  severity: Severity;
  suggestion: string;
  file?: string;
}

export interface ContextFileAudit {
  files: Array<{
    path: string;
    estimatedTokens: number;
    bytes: number;
  }>;
  findings: Finding[];
  score: number;
}

export interface CacheAudit {
  findings: Finding[];
  score: number;
  cacheHitRatio: number;
  cachedTokens: number;
  inputTokens: number;
}

export interface ContextSecurityAudit {
  findings: Finding[];
  score: number;
}
