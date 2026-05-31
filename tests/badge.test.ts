import { describe, expect, it } from 'vitest';
import { buildAudit } from '../src/audit/buildAudit.js';
import { createBadgeSvg } from '../src/report/badge.js';

describe('audit badge', () => {
  it('renders a compact SVG status badge from audit scores', async () => {
    const audit = await buildAudit({
      records: [],
      rootDir: 'fixtures/project',
      minContextScore: 70,
      minCacheScore: 70,
      minSecurityScore: 70
    });

    const svg = createBadgeSvg(audit);

    expect(svg).toContain('<svg');
    expect(svg).toContain('ContextForge');
    expect(svg).toContain('pass 92');
    expect(svg).toContain('#2ea043');
  });
});
