import { describe, expect, it } from 'vitest';
import { createAdoptionBrief } from '../src/report/adoptionBrief.js';

describe('adoption brief', () => {
  it('creates a first-time maintainer evaluator page with proof and try-it paths', () => {
    const brief = createAdoptionBrief({
      projectName: 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    });

    expect(brief).toContain('# ContextForge Adoption Brief');
    expect(brief).toContain('## Why Now');
    expect(brief).toContain('## Who Should Try It');
    expect(brief).toContain('## 30-Second Evaluation Path');
    expect(brief).toContain('contextforge launch-snapshot --output docs/launch-snapshot.md');
    expect(brief).toContain('contextforge scorecard --output contextforge-scorecard.md');
    expect(brief).toContain('contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif');
    expect(brief).toContain('contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif');
    expect(brief).toContain('contextforge workflow-audit --summary contextforge-workflow-audit.md --sarif contextforge-workflow.sarif');
    expect(brief).toContain('contextforge trace-audit --demo --summary contextforge-trace-audit.md');
    expect(brief).toContain('contextforge cost-estimate --demo --summary contextforge-cost-estimate.md');
    expect(brief).toContain('## How It Fits');
    expect(brief).toContain('Repomix');
    expect(brief).toContain('ccusage');
    expect(brief).toContain('promptfoo');
    expect(brief).toContain('agentic workflow hardening guides');
    expect(brief).toContain('## Try It Before npm Publish');
    expect(brief).toContain('grnbtqdbyx-create/contextforge');
    expect(brief).toContain('## Star-Worthy Proof');
  });
});
