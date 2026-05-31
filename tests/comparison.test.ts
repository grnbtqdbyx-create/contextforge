import { describe, expect, it } from 'vitest';
import { createComparisonGuide } from '../src/report/comparison.js';

describe('comparison guide', () => {
  it('explains how ContextForge differs from adjacent agent-context tools', () => {
    const guide = createComparisonGuide();

    expect(guide).toContain('# ContextForge Comparison Guide');
    expect(guide).toContain('Repomix');
    expect(guide).toContain('ccusage');
    expect(guide).toContain('promptfoo');
    expect(guide).toContain('ContextForge is the maintainer readiness layer');
    expect(guide).toContain('## When To Use ContextForge');
  });
});
