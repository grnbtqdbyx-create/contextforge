import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditAgenticWorkflows, createAgenticWorkflowSummary, formatAgenticWorkflowAudit } from '../src/analyzers/agenticWorkflow.js';
import { createAgenticWorkflowSarif } from '../src/report/agenticWorkflowSarif.js';

describe('agentic workflow audit', () => {
  it('detects untrusted GitHub event context flowing into agentic workflows with write permissions', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agentic-workflow-risk-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await writeFile(
      path.join(rootDir, '.github/workflows/agent-review.yml'),
      [
        'name: AI review',
        'on:',
        '  pull_request_target:',
        'permissions:',
        '  contents: write',
        '  pull-requests: write',
        'jobs:',
        '  review:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: codex exec "Review ${{ github.event.pull_request.body }}"',
        '        env:',
        '          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}'
      ].join('\n')
    );

    const audit = await auditAgenticWorkflows({ rootDir });
    const types = audit.findings.map((finding) => finding.type);
    const text = formatAgenticWorkflowAudit(audit);
    const summary = createAgenticWorkflowSummary(audit);
    const sarif = createAgenticWorkflowSarif(audit);

    expect(audit.status).toBe('fail');
    expect(audit.files).toEqual(['.github/workflows/agent-review.yml']);
    expect(types).toContain('agentic-untrusted-event-context');
    expect(types).toContain('agentic-write-permissions');
    expect(types).toContain('agentic-secret-exposure');
    expect(text).toContain('ContextForge agentic workflow audit: fail');
    expect(summary).toContain('# ContextForge Agentic Workflow Audit');
    expect(summary).toContain('| agentic-untrusted-event-context | high |');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge Agentic Workflows');
    expect(sarif.runs[0].results.some((result) => result.ruleId === 'agentic-workflow/agentic-untrusted-event-context')).toBe(true);
  });

  it('passes deterministic workflows that do not feed event text into agents', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agentic-workflow-safe-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await writeFile(
      path.join(rootDir, '.github/workflows/ci.yml'),
      ['name: CI', 'on:', '  pull_request:', 'permissions:', '  contents: read', 'jobs:', '  test:', '    runs-on: ubuntu-latest', '    steps:', '      - run: pnpm test'].join('\n')
    );

    const audit = await auditAgenticWorkflows({ rootDir });

    expect(audit.status).toBe('pass');
    expect(audit.files).toEqual(['.github/workflows/ci.yml']);
    expect(audit.findings).toHaveLength(0);
  });

  it('keeps the bundled demo fixture intentionally risky', async () => {
    const audit = await auditAgenticWorkflows({ rootDir: 'fixtures/agentic-workflow-risk' });

    expect(audit.status).toBe('fail');
    expect(audit.findings.map((finding) => finding.type)).toContain('agentic-secret-exposure');
  });
});
