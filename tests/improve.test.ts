import { describe, expect, it } from 'vitest';
import { suggestRuleImprovements } from '../src/improve/ruleSuggestions.js';

describe('rule improvement suggestions', () => {
  it('turns audit findings into actionable repo-rule suggestions', () => {
    const suggestions = suggestRuleImprovements({
      contextFindings: [
        { file: 'AGENTS.md', type: 'vague', message: 'Too vague', severity: 'medium', suggestion: 'Replace vague guidance.' }
      ],
      cacheFindings: [
        { type: 'large-tool-output', message: 'Large output', severity: 'high', suggestion: 'Summarize tool output.' }
      ]
    });
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions[0]?.text).toContain('AGENTS.md');
  });
});
