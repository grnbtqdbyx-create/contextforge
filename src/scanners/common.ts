import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Provider, RecordKind, SessionRecord } from '../types.js';
import { estimateTokens } from '../tokenizers/index.js';

const DEFAULT_MAX_SESSION_FILES = 50;
const DEFAULT_MAX_SESSION_FILE_BYTES = 5 * 1024 * 1024;

function usageNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function contentToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(contentToText).filter(Boolean).join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '';
}

function inferKind(item: Record<string, unknown>): RecordKind {
  const type = String(item.type ?? '');
  const payload = getObject(item.payload);
  const payloadType = String(payload.type ?? '');
  const role = String((item.message as { role?: unknown } | undefined)?.role ?? item.role ?? payload.role ?? '');
  if (type === 'session_meta' || type === 'turn_context') return 'system';
  if (type === 'event_msg' && payloadType === 'user_message') return 'user';
  if (type === 'event_msg' && payloadType === 'token_count') return 'system';
  if (type === 'response_item' && (payloadType === 'function_call' || payloadType === 'function_call_output')) return 'tool';
  if (type.includes('tool') || item.tool) return 'tool';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'system') return 'system';
  return 'unknown';
}

export function normalizeRecord(provider: Provider, source: string, item: unknown): SessionRecord {
  const object = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const usage = extractUsage(object);
  const content = extractContent(object);
  const inputTokens = usage.inputTokens || estimateTokens(content, provider);

  return {
    provider,
    source,
    project: inferProject(source),
    kind: inferKind(object),
    content,
    inputTokens,
    outputTokens: usage.outputTokens,
    cachedTokens: usage.cachedTokens,
    timestamp: typeof object.timestamp === 'string' ? object.timestamp : undefined,
    toolName: extractToolName(object)
  };
}

export async function selectRecentReadableSessionFiles(
  files: string[],
  options: { maxFiles?: number; maxFileBytes?: number } = {}
): Promise<string[]> {
  const maxFiles = Math.max(1, options.maxFiles ?? DEFAULT_MAX_SESSION_FILES);
  const maxFileBytes = Math.max(1, options.maxFileBytes ?? DEFAULT_MAX_SESSION_FILE_BYTES);
  const recentFiles = [...files].sort().reverse().slice(0, maxFiles);
  const selected: string[] = [];

  for (const file of recentFiles) {
    const stat = await fs.stat(file);
    if (stat.size <= maxFileBytes) selected.push(file);
  }
  return selected;
}

function extractContent(object: Record<string, unknown>): string {
  const payload = getObject(object.payload);
  const payloadType = String(payload.type ?? '');
  const message = getObject(object.message);

  if (object.type === 'session_meta') return contentToText(payload);
  if (object.type === 'turn_context') return contentToText(payload);
  if (object.type === 'event_msg' && payloadType === 'user_message') return contentToText(payload.message);
  if (object.type === 'event_msg' && payloadType === 'token_count') return contentToText(payload.info);
  if (object.type === 'response_item' && payloadType === 'function_call') {
    return contentToText(payload.arguments);
  }
  if (object.type === 'response_item' && payloadType === 'function_call_output') {
    return contentToText(payload.output);
  }
  if (object.type === 'response_item') return contentToText(payload.content ?? payload.text ?? payload);
  return contentToText(message.content ?? object.content ?? object.text ?? '');
}

function extractUsage(object: Record<string, unknown>): { inputTokens: number; outputTokens: number; cachedTokens: number } {
  const payload = getObject(object.payload);
  const info = getObject(payload.info);
  const totalUsage = getObject(info.total_token_usage);
  const usage = Object.keys(totalUsage).length > 0 ? totalUsage : getObject(object.usage);
  const promptDetails = getObject(usage.prompt_tokens_details);

  return {
    inputTokens: usageNumber(usage.input_tokens ?? usage.prompt_tokens),
    outputTokens: usageNumber(usage.output_tokens ?? usage.completion_tokens),
    cachedTokens: usageNumber(
      usage.cached_input_tokens ?? promptDetails.cached_tokens ?? usage.cached_tokens ?? usage.cache_read_input_tokens
    )
  };
}

function extractToolName(object: Record<string, unknown>): string | undefined {
  const payload = getObject(object.payload);
  if (typeof object.tool === 'string') return object.tool;
  if (typeof payload.name === 'string') return payload.name;
  return undefined;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function inferProject(source: string): string {
  const parts = source.split(path.sep);
  const projectIndex = parts.findIndex((part) => part === 'projects');
  if (projectIndex >= 0 && parts[projectIndex + 1]) return parts[projectIndex + 1] ?? 'unknown';
  if (source.includes('fixtures')) return 'demo';
  return path.basename(path.dirname(source)) || 'unknown';
}
