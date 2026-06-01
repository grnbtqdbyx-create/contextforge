import { describe, expect, it } from 'vitest';
import { createLaunchSnapshot } from '../src/report/launchSnapshot.js';

describe('launch snapshot', () => {
  it('creates a shareable research-backed snapshot for README visitors and launch posts', () => {
    const snapshot = createLaunchSnapshot({
      projectName: 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    });

    expect(snapshot).toContain('# ContextForge Launch Snapshot');
    expect(snapshot).toContain('## Why This Exists Now');
    expect(snapshot).toContain('AGENTS.md');
    expect(snapshot).toContain('MCP');
    expect(snapshot).toContain('Agentic workflow injection');
    expect(snapshot).toContain('## Adjacent Projects People Already Understand');
    expect(snapshot).toContain('context engineering guides');
    expect(snapshot).toContain('agent instruction templates');
    expect(snapshot).toContain('token dashboards');
    expect(snapshot).toContain('MCP security lists');
    expect(snapshot).toContain('## What To Open First');
    expect(snapshot).toContain('contextforge-scorecard.md');
    expect(snapshot).toContain('contextforge-agent-surface-diff.md');
    expect(snapshot).toContain('contextforge-publish-readiness.md');
    expect(snapshot).toContain('## Share Copy');
    expect(snapshot).toContain('https://github.com/grnbtqdbyx-create/contextforge');
  });
});
