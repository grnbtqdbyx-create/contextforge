import { describe, expect, it } from 'vitest';
import { createArtifactMap } from '../src/report/artifactMap.js';

describe('artifact map report', () => {
  it('explains which ContextForge artifact to inspect for reviewer and agent handoffs', () => {
    const map = createArtifactMap();

    expect(map).toContain('# ContextForge Artifact Map');
    expect(map).toContain('contextforge-review-kit.md');
    expect(map).toContain('contextforge-artifact-map.md');
    expect(map).toContain('contextforge-proof-pack.md');
    expect(map).toContain('npm metadata, provenance links, Trusted Publishing');
    expect(map).toContain('contextforge-agent-plan.md');
    expect(map).toContain('For a PR reviewer');
    expect(map).toContain('For Codex/Claude fixing failures');
    expect(map).toContain('contextforge artifact-map --output docs/artifacts.md');
  });
});
