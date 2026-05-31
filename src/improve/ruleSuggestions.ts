import type { Finding } from '../types.js';

export interface RuleSuggestion {
  title: string;
  text: string;
  source: string;
}

export function suggestRuleImprovements(input: {
  contextFindings?: Finding[];
  cacheFindings?: Finding[];
}): RuleSuggestion[] {
  const suggestions: RuleSuggestion[] = [];
  for (const finding of input.contextFindings ?? []) {
    suggestions.push({
      title: `Improve ${finding.file ?? 'repo context'}: ${finding.type}`,
      text: `${finding.file ?? 'AGENTS.md'}: ${finding.suggestion}`,
      source: finding.type
    });
  }
  for (const finding of input.cacheFindings ?? []) {
    suggestions.push({
      title: `Improve cache stability: ${finding.type}`,
      text: `Cache guidance: ${finding.suggestion}`,
      source: finding.type
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Keep repo-level instructions minimal',
      text: 'AGENTS.md should contain only concrete, repository-specific rules that improve task success.',
      source: 'default'
    });
  }
  return suggestions;
}

