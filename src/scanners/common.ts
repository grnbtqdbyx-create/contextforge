import path from 'node:path';
import type { Provider, RecordKind, SessionRecord } from '../types.js';
import { estimateTokens } from '../tokenizers/index.js';

function usageNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function contentToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(contentToText).join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '';
}

function inferKind(item: Record<string, unknown>): RecordKind {
  const type = String(item.type ?? '');
  const role = String((item.message as { role?: unknown } | undefined)?.role ?? item.role ?? '');
  if (type.includes('tool') || item.tool) return 'tool';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'system') return 'system';
  return 'unknown';
}

export function normalizeRecord(provider: Provider, source: string, item: unknown): SessionRecord {
  const object = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const usage = (object.usage && typeof object.usage === 'object' ? object.usage : {}) as Record<string, unknown>;
  const message = (object.message && typeof object.message === 'object' ? object.message : {}) as Record<string, unknown>;
  const promptDetails = (usage.prompt_tokens_details && typeof usage.prompt_tokens_details === 'object'
    ? usage.prompt_tokens_details
    : {}) as Record<string, unknown>;
  const content = contentToText(message.content ?? object.content ?? object.text ?? '');
  const inputTokens = usageNumber(usage.input_tokens ?? usage.prompt_tokens) || estimateTokens(content, provider);
  const outputTokens = usageNumber(usage.output_tokens ?? usage.completion_tokens);
  const cachedTokens = usageNumber(
    promptDetails.cached_tokens ?? usage.cached_tokens ?? usage.cache_read_input_tokens
  );

  return {
    provider,
    source,
    project: inferProject(source),
    kind: inferKind(object),
    content,
    inputTokens,
    outputTokens,
    cachedTokens,
    timestamp: typeof object.timestamp === 'string' ? object.timestamp : undefined,
    toolName: typeof object.tool === 'string' ? object.tool : undefined
  };
}

function inferProject(source: string): string {
  const parts = source.split(path.sep);
  const projectIndex = parts.findIndex((part) => part === 'projects');
  if (projectIndex >= 0 && parts[projectIndex + 1]) return parts[projectIndex + 1] ?? 'unknown';
  if (source.includes('fixtures')) return 'demo';
  return path.basename(path.dirname(source)) || 'unknown';
}

