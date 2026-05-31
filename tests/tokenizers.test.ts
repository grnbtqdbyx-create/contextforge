import { describe, expect, it } from 'vitest';
import { estimateTokens, tokenEstimateLabel } from '../src/tokenizers/index.js';

describe('token estimation', () => {
  it('estimates tokens with a provider-aware label', () => {
    expect(estimateTokens('hello world from ContextForge', 'openai')).toBeGreaterThan(0);
    expect(tokenEstimateLabel('claude')).toContain('estimated');
  });
});
