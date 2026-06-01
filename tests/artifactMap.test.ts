import { describe, expect, it } from 'vitest';
import { createArtifactMap } from '../src/report/artifactMap.js';

describe('artifact map report', () => {
  it('explains which ContextForge artifact to inspect for reviewer and agent handoffs', () => {
    const map = createArtifactMap();

    expect(map).toContain('# ContextForge Artifact Map');
    expect(map).toContain('contextforge-review-kit.md');
    expect(map).toContain('contextforge-artifact-map.md');
    expect(map).toContain('contextforge-proof-pack.md');
    expect(map).toContain('contextforge-scorecard.md');
    expect(map).toContain('contextforge-agent-surface-map.md');
    expect(map).toContain('contextforge-agent-surface-inventory.md');
    expect(map).toContain('contextforge-agent-surface-diff.md');
    expect(map).toContain('contextforge surface-map --output contextforge-agent-surface-map.md');
    expect(map).toContain('contextforge surface-inventory --output contextforge-agent-surface-inventory.md');
    expect(map).toContain('contextforge surface-diff --base main --output contextforge-agent-surface-diff.md');
    expect(map).toContain('docs/adoption.md');
    expect(map).toContain('contextforge-mcp-audit.md');
    expect(map).toContain('contextforge-mcp.sarif');
    expect(map).toContain('contextforge-claude-audit.md');
    expect(map).toContain('contextforge-claude.sarif');
    expect(map).toContain('contextforge-trace-audit.md');
    expect(map).toContain('contextforge-cost-estimate.md');
    expect(map).toContain('npm metadata, provenance links, Trusted Publishing');
    expect(map).toContain('contextforge-agent-plan.md');
    expect(map).toContain('For a PR reviewer');
    expect(map).toContain('For Codex/Claude fixing failures');
    expect(map).toContain('contextforge artifact-map --output docs/artifacts.md');
  });
});
