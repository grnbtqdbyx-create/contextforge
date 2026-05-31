import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { runDoctor } from '../src/doctor/doctor.js';
import { createProofPack } from '../src/report/proofPack.js';

describe('proof pack report', () => {
  it('combines doctor checks, audit scores, and rerun commands into one Markdown artifact', async () => {
    const doctor = await runDoctor({
      rootDir: 'fixtures/project',
      records: [],
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/project',
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });

    const markdown = createProofPack({ doctor, audit });

    expect(markdown).toContain('# ContextForge Proof Pack');
    expect(markdown).toContain('## Readiness Snapshot');
    expect(markdown).toContain('| Doctor |');
    expect(markdown).toContain('| Audit |');
    expect(markdown).toContain('## Doctor Checks');
    expect(markdown).toContain('Public proof surfaces');
    expect(markdown).toContain('## Evidence Commands');
    expect(markdown).toContain('contextforge doctor --summary contextforge-doctor.md');
    expect(markdown).toContain('contextforge audit --summary contextforge-summary.md');
    expect(markdown).toContain('## Codex / Claude Handoff');
  });
});
