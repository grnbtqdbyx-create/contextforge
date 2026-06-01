import { describe, expect, it } from 'vitest';
import { createLaunchKit } from '../src/report/launchKit.js';

describe('launch kit report', () => {
  it('creates a shareable build-in-public launch kit for agent-ready repos', () => {
    const kit = createLaunchKit({
      projectName: 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    });

    expect(kit).toContain('# ContextForge Launch Kit');
    expect(kit).toContain('## One-Liner');
    expect(kit).toContain('contextforge adoption-brief --output docs/adoption.md');
    expect(kit).toContain('contextforge doctor --summary contextforge-doctor.md');
    expect(kit).toContain('contextforge artifact-map --output docs/artifacts.md');
    expect(kit).toContain('contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif');
    expect(kit).toContain('contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif');
    expect(kit).toContain('## Suggested GitHub Topics');
    expect(kit).toContain('codex');
    expect(kit).toContain('claude-code');
    expect(kit).toContain('## Launch Post Draft');
    expect(kit).toContain('https://github.com/grnbtqdbyx-create/contextforge');
  });
});
