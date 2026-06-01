import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('README first-viewport positioning', () => {
  it('shows a quick evaluator path and cross-agent coverage before deep artifacts', async () => {
    const readme = await readFile('README.md', 'utf8');
    const firstViewport = readme.slice(0, readme.indexOf('## Report Preview'));

    expect(firstViewport).toContain('Agent Context Gate');
    expect(firstViewport).toContain('30-second proof');
    expect(firstViewport).toContain('Codex');
    expect(firstViewport).toContain('Claude Code');
    expect(firstViewport).toContain('GitHub Copilot');
    expect(firstViewport).toContain('MCP');
    expect(firstViewport).toContain('contextforge audit --min-context-score 70');
    expect(firstViewport).toContain('contextforge surface-map --output contextforge-agent-surface-map.md');
  });
});
