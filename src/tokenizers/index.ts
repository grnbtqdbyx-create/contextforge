import type { Provider } from '../types.js';

export function estimateTokens(text: string, provider: Provider | 'openai' = 'openai'): number {
  if (!text) return 0;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 0;
  const words = normalized.split(' ').length;
  const charEstimate = Math.ceil(normalized.length / (provider === 'claude' ? 3.7 : 4));
  return Math.max(1, Math.ceil((charEstimate + words * 0.75) / 2));
}

export function tokenEstimateLabel(provider: Provider | 'openai'): string {
  if (provider === 'claude') {
    return 'estimated tokens (Claude tokenizer is not public)';
  }
  if (provider === 'codex' || provider === 'openai') {
    return 'estimated tokens (OpenAI-compatible approximation)';
  }
  return 'estimated tokens';
}

