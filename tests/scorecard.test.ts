import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { runDoctor } from '../src/doctor/doctor.js';
import { createAgentReadinessScorecard, createAgentReadinessScorecardData } from '../src/report/scorecard.js';

describe('agent readiness scorecard', () => {
  it('creates a one-screen Codex and Claude readiness summary for README surfaces', async () => {
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

    const data = createAgentReadinessScorecardData({ doctor, audit });
    const markdown = createAgentReadinessScorecard(data);

    expect(data.agentReadinessScore).toBeGreaterThan(0);
    expect(markdown).toContain('# ContextForge Agent Readiness Scorecard');
    expect(markdown).toContain('| Agent readiness score |');
    expect(markdown).toContain('| Context health |');
    expect(markdown).toContain('| Cache stability |');
    expect(markdown).toContain('| Context security |');
    expect(markdown).toContain('## Why Codex And Claude Should Care');
    expect(markdown).toContain('contextforge proof-pack --output contextforge-proof-pack.md');
    expect(markdown).toContain('contextforge review-kit --base main --output contextforge-review-kit.md');
  });
});
