import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { scannerOptionsFromArgs } from '../src/cli.js';

const execFileAsync = promisify(execFile);

describe('CLI argument mapping', () => {
  it('forwards bounded session scan options to scanners', () => {
    expect(
      scannerOptionsFromArgs({
        command: 'scan',
        demo: false,
        codex: true,
        claude: false,
        task: 'x',
        budget: 100,
        output: 'out',
        report: 'report',
        benchmarkDir: undefined,
        sarif: undefined,
        summary: undefined,
        plan: undefined,
        comment: undefined,
        suggestions: undefined,
        badge: undefined,
        sessions: true,
        json: false,
        write: false,
        openPr: false,
        all: false,
        githubAction: false,
        prCommentWorkflow: false,
        agentsMd: false,
        claudeMd: false,
        copilotInstructions: false,
        force: false,
        actionRef: undefined,
        projectName: undefined,
        baseRef: 'main',
        minContextScore: 60,
        minCacheScore: 60,
        minSecurityScore: 60,
        maxFiles: 7,
        maxFileBytes: 1024,
        inputPricePerMTok: undefined,
        cachedInputPricePerMTok: undefined,
        outputPricePerMTok: undefined
      })
    ).toEqual({
      demo: false,
      maxFiles: 7,
      maxFileBytes: 1024
    });
  });
});

describe('CLI help command', () => {
  it('prints the current default GitHub Action ref in init examples', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'help']);

    expect(stdout).toContain('--action-ref grnbtqdbyx-create/contextforge@v0.72.0');
  });
});

describe('CLI doctor command', () => {
  it('prints a first-run readiness report in demo mode', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'doctor', '--demo']);

    expect(stdout).toContain('ContextForge doctor');
    expect(stdout).toContain('Context health:');
    expect(stdout).toContain('Cache stability:');
    expect(stdout).toContain('Context security:');
    expect(stdout).toContain('Security benchmark:');
    expect(stdout).toContain('GitHub workflows:');
    expect(stdout).toContain('Public proof surfaces:');
    expect(stdout).toContain('Launch profile surfaces:');
    expect(stdout).toContain('Community health surfaces:');
    expect(stdout).toContain('Next actions:');
  });

  it('prints machine-readable doctor JSON when requested', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'doctor', '--demo', '--json']);
    const result = JSON.parse(stdout) as {
      status: string;
      checks: Array<{ name: string; status: string; detail: string }>;
      nextActions: string[];
    };

    expect(result.status).toBe('warn');
    expect(result.checks.some((check) => check.name === 'Context health')).toBe(true);
    expect(result.checks.some((check) => check.name === 'GitHub workflows')).toBe(true);
    expect(result.checks.some((check) => check.name === 'Public proof surfaces')).toBe(true);
    expect(result.checks.some((check) => check.name === 'Launch profile surfaces')).toBe(true);
    expect(result.checks.some((check) => check.name === 'Community health surfaces')).toBe(true);
    expect(result.nextActions.length).toBeGreaterThan(0);
  });

  it('writes a shareable Markdown doctor summary when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-doctor-summary-'));
    const summaryPath = path.join(rootDir, 'doctor-summary.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'doctor', '--demo', '--summary', summaryPath]);
    const summary = await readFile(summaryPath, 'utf8');

    expect(stdout).toContain(`Wrote ${summaryPath}`);
    expect(summary).toContain('# ContextForge Doctor');
    expect(summary).toContain('| Check | Status | Detail |');
    expect(summary).toContain('Community health surfaces');
    expect(summary).toContain('## Next Actions');
    await rm(rootDir, { recursive: true, force: true });
  });

  it('keeps doctor JSON stdout parseable when also writing a summary', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-doctor-json-summary-'));
    const summaryPath = path.join(rootDir, 'doctor-summary.md');

    const { stdout, stderr } = await execFileAsync('pnpm', ['contextforge', 'doctor', '--demo', '--json', '--summary', summaryPath]);
    const result = JSON.parse(stdout) as { checks: Array<{ name: string }> };

    expect(result.checks.some((check) => check.name === 'Community health surfaces')).toBe(true);
    expect(stderr).toContain(`Wrote ${summaryPath}`);
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI improve command', () => {
  it('prints machine-readable suggestions JSON when requested', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'improve', '--demo', '--json']);
    const result = JSON.parse(stdout) as {
      suggestions: Array<{ title: string; text: string; source: string }>;
    };

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        text: expect.any(String),
        source: expect.any(String)
      })
    );
  });
});

describe('CLI audit command', () => {
  it('writes machine-readable improvement suggestions when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-suggestions-'));
    const auditPath = path.join(rootDir, 'audit.json');
    const reportPath = path.join(rootDir, 'report.html');
    const suggestionsPath = path.join(rootDir, 'suggestions.json');

    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--output',
      auditPath,
      '--report',
      reportPath,
      '--suggestions',
      suggestionsPath
    ]);
    const result = JSON.parse(await readFile(suggestionsPath, 'utf8')) as {
      suggestions: Array<{ title: string; text: string; source: string }>;
    };

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        text: expect.any(String),
        source: expect.any(String)
      })
    );
    await rm(rootDir, { recursive: true, force: true });
  });

  it('writes an SVG audit badge when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-badge-'));
    const auditPath = path.join(rootDir, 'audit.json');
    const reportPath = path.join(rootDir, 'report.html');
    const badgePath = path.join(rootDir, 'badge.svg');

    await execFileAsync('pnpm', [
      'contextforge',
      'audit',
      '--demo',
      '--output',
      auditPath,
      '--report',
      reportPath,
      '--badge',
      badgePath
    ]);
    const badge = await readFile(badgePath, 'utf8');

    expect(badge).toContain('<svg');
    expect(badge).toContain('ContextForge');
    expect(badge).toContain('pass');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI launch-kit command', () => {
  it('writes a launch kit Markdown file for build-in-public posts', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-launch-kit-'));
    const outputPath = path.join(rootDir, 'launch-kit.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'launch-kit', '--output', outputPath, '--project-name', 'ContextForge']);
    const kit = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(kit).toContain('# ContextForge Launch Kit');
    expect(kit).toContain('## Launch Post Draft');
    expect(kit).toContain('contextforge doctor --summary contextforge-doctor.md');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI launch-snapshot command', () => {
  it('writes a shareable launch snapshot for README visitors', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-launch-snapshot-'));
    const outputPath = path.join(rootDir, 'launch-snapshot.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'launch-snapshot', '--output', outputPath, '--project-name', 'ContextForge']);
    const snapshot = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(snapshot).toContain('# ContextForge Launch Snapshot');
    expect(snapshot).toContain('## What To Open First');
    expect(snapshot).toContain('contextforge-scorecard.md');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI adoption-brief command', () => {
  it('writes an evaluator adoption brief for first-time maintainers', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-adoption-brief-'));
    const outputPath = path.join(rootDir, 'adoption.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'adoption-brief', '--output', outputPath]);
    const brief = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(brief).toContain('# ContextForge Adoption Brief');
    expect(brief).toContain('## 30-Second Evaluation Path');
    expect(brief).toContain('contextforge mcp-audit --summary contextforge-mcp-audit.md');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI mcp-audit command', () => {
  it('writes SARIF for MCP exposure findings when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-mcp-sarif-'));
    const sarifPath = path.join(rootDir, 'contextforge-mcp.sarif');

    await expect(
      execFileAsync('pnpm', ['contextforge', 'mcp-audit', '--demo', '--sarif', sarifPath])
    ).rejects.toMatchObject({
      stdout: expect.stringContaining('ContextForge MCP exposure audit: fail')
    });
    const sarif = JSON.parse(await readFile(sarifPath, 'utf8')) as {
      version: string;
      runs: Array<{ tool: { driver: { name: string } }; results: Array<{ ruleId: string }> }>;
    };

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge MCP Exposure');
    expect(sarif.runs[0].results.some((result) => result.ruleId === 'mcp-exposure/hardcoded-secret')).toBe(true);
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI claude-audit command', () => {
  it('writes Claude Code settings summary and SARIF when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-claude-audit-'));
    const summaryPath = path.join(rootDir, 'contextforge-claude-audit.md');
    const sarifPath = path.join(rootDir, 'contextforge-claude.sarif');

    await expect(
      execFileAsync('pnpm', ['contextforge', 'claude-audit', '--demo', '--summary', summaryPath, '--sarif', sarifPath])
    ).rejects.toMatchObject({
      stdout: expect.stringContaining('ContextForge Claude settings audit: fail')
    });
    const summary = await readFile(summaryPath, 'utf8');
    const sarif = JSON.parse(await readFile(sarifPath, 'utf8')) as {
      version: string;
      runs: Array<{ tool: { driver: { name: string } }; results: Array<{ ruleId: string }> }>;
    };

    expect(summary).toContain('# ContextForge Claude Code Settings Audit');
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge Claude Settings');
    expect(sarif.runs[0].results.some((result) => result.ruleId === 'claude-settings/claude-bypass-mode')).toBe(true);
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI workflow-audit command', () => {
  it('writes an agentic workflow summary and SARIF when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-workflow-audit-'));
    const summaryPath = path.join(rootDir, 'workflow-audit.md');
    const sarifPath = path.join(rootDir, 'workflow-audit.sarif');

    const { stdout } = await execFileAsync('pnpm', [
      'contextforge',
      'workflow-audit',
      '--summary',
      summaryPath,
      '--sarif',
      sarifPath
    ]);
    const summary = await readFile(summaryPath, 'utf8');
    const sarif = JSON.parse(await readFile(sarifPath, 'utf8')) as { runs: Array<{ tool: { driver: { name: string } } }> };

    expect(stdout).toContain('ContextForge agentic workflow audit:');
    expect(stdout).toContain(`Wrote ${summaryPath} and ${sarifPath}`);
    expect(summary).toContain('# ContextForge Agentic Workflow Audit');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge Agentic Workflows');
    await rm(rootDir, { recursive: true, force: true });
  });

  it('uses the bundled risky fixture for workflow-audit demo mode', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-workflow-audit-demo-'));
    const summaryPath = path.join(rootDir, 'workflow-audit.md');

    await expect(execFileAsync('pnpm', ['contextforge', 'workflow-audit', '--demo', '--summary', summaryPath])).rejects.toMatchObject({
      stdout: expect.stringContaining('ContextForge agentic workflow audit: fail')
    });
    const summary = await readFile(summaryPath, 'utf8');

    expect(summary).toContain('agentic-secret-exposure');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI actions-audit command', () => {
  it('writes a GitHub Actions hardening summary and SARIF when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-actions-audit-'));
    const summaryPath = path.join(rootDir, 'actions-audit.md');
    const sarifPath = path.join(rootDir, 'actions-audit.sarif');

    const { stdout } = await execFileAsync('pnpm', [
      'contextforge',
      'actions-audit',
      '--summary',
      summaryPath,
      '--sarif',
      sarifPath
    ]);
    const summary = await readFile(summaryPath, 'utf8');
    const sarif = JSON.parse(await readFile(sarifPath, 'utf8')) as { runs: Array<{ tool: { driver: { name: string } } }> };

    expect(stdout).toContain('ContextForge GitHub Actions audit:');
    expect(stdout).toContain(`Wrote ${summaryPath} and ${sarifPath}`);
    expect(summary).toContain('# ContextForge GitHub Actions Audit');
    expect(sarif.runs[0].tool.driver.name).toBe('ContextForge GitHub Actions');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI trace-audit command', () => {
  it('writes an agent trace efficiency summary when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-trace-audit-'));
    const summaryPath = path.join(rootDir, 'contextforge-trace-audit.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'trace-audit', '--demo', '--summary', summaryPath]);
    const summary = await readFile(summaryPath, 'utf8');

    expect(stdout).toContain('ContextForge trace efficiency audit: warn');
    expect(summary).toContain('# ContextForge Trace Efficiency Audit');
    expect(summary).toContain('redundant-tool-call');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI cost-estimate command', () => {
  it('writes a configurable session cost estimate summary', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-cost-estimate-'));
    const summaryPath = path.join(rootDir, 'contextforge-cost-estimate.md');

    const { stdout } = await execFileAsync('pnpm', [
      'contextforge',
      'cost-estimate',
      '--demo',
      '--input-price-per-mtok',
      '2',
      '--cached-input-price-per-mtok',
      '0.2',
      '--output-price-per-mtok',
      '10',
      '--summary',
      summaryPath
    ]);
    const summary = await readFile(summaryPath, 'utf8');

    expect(stdout).toContain('ContextForge cost estimate: priced');
    expect(summary).toContain('# ContextForge Cost Estimate');
    expect(summary).toContain('Total estimated cost');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI pack command', () => {
  it('writes a context pack with a visible budget ledger', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-pack-ledger-'));
    const outputPath = path.join(rootDir, 'contextforge-pack.md');

    const { stdout } = await execFileAsync('pnpm', [
      'contextforge',
      'pack',
      '--demo',
      '--task',
      'fix auth bug',
      '--budget',
      '120',
      '--output',
      outputPath
    ]);
    const pack = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(stdout).toContain('within budget');
    expect(pack).toContain('## Budget Ledger');
    expect(pack).toContain('| Requested budget | 120 tokens |');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI artifact-map command', () => {
  it('writes an artifact map Markdown file for reviewers and agents', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-artifact-map-'));
    const outputPath = path.join(rootDir, 'artifacts.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'artifact-map', '--output', outputPath]);
    const map = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(map).toContain('# ContextForge Artifact Map');
    expect(map).toContain('contextforge-review-kit.md');
    expect(map).toContain('contextforge-proof-pack.md');
    expect(map).toContain('For a PR reviewer');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI compare command', () => {
  it('writes a comparison guide for README and launch positioning', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-compare-'));
    const outputPath = path.join(rootDir, 'comparison.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'compare', '--output', outputPath]);
    const guide = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(guide).toContain('# ContextForge Comparison Guide');
    expect(guide).toContain('Repomix');
    expect(guide).toContain('ccusage');
    expect(guide).toContain('ContextForge is the maintainer readiness layer');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI publish-readiness command', () => {
  it('prints npm publish readiness and writes a Markdown summary', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-publish-readiness-'));
    const outputPath = path.join(rootDir, 'publish-readiness.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'publish-readiness', '--summary', outputPath]);
    const summary = await readFile(outputPath, 'utf8');

    expect(stdout).toContain('ContextForge npm publish readiness:');
    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(summary).toContain('# ContextForge npm Publish Readiness');
    expect(summary).toContain('Trusted publishing workflow');
    await rm(rootDir, { recursive: true, force: true });
  });

  it('keeps publish readiness JSON stdout parseable when also writing a summary', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-publish-readiness-json-'));
    const outputPath = path.join(rootDir, 'publish-readiness.md');

    const { stdout, stderr } = await execFileAsync('pnpm', ['contextforge', 'publish-readiness', '--json', '--summary', outputPath]);
    const result = JSON.parse(stdout) as { checks: Array<{ name: string }> };

    expect(result.checks.some((check) => check.name === 'Trusted publishing workflow')).toBe(true);
    expect(stderr).toContain(`Wrote ${outputPath}`);
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI scorecard command', () => {
  it('writes a one-screen agent readiness scorecard for README and CI artifacts', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-scorecard-'));
    const outputPath = path.join(rootDir, 'contextforge-scorecard.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'scorecard', '--demo', '--output', outputPath]);
    const scorecard = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(scorecard).toContain('# ContextForge Agent Readiness Scorecard');
    expect(scorecard).toContain('| Agent readiness score |');
    expect(scorecard).toContain('## Why Codex And Claude Should Care');
    await rm(rootDir, { recursive: true, force: true });
  });

  it('prints machine-readable scorecard JSON when requested', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'scorecard', '--demo', '--json']);
    const result = JSON.parse(stdout) as { agentReadinessScore: number; artifacts: string[] };

    expect(result.agentReadinessScore).toBeGreaterThan(0);
    expect(result.artifacts).toContain('contextforge-proof-pack.md');
  });
});

describe('CLI mcp-audit command', () => {
  it('prints machine-readable MCP exposure JSON when requested', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'mcp-audit', '--json']);
    const result = JSON.parse(stdout) as { status: string; files: string[]; findings: unknown[] };

    expect(result.status).toMatch(/pass|warn|fail/);
    expect(Array.isArray(result.files)).toBe(true);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('writes an MCP exposure summary when requested', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-mcp-summary-'));
    const outputPath = path.join(rootDir, 'contextforge-mcp-audit.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'mcp-audit', '--summary', outputPath]);
    const summary = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(summary).toContain('# ContextForge MCP Exposure Audit');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI proof-pack command', () => {
  it('stays repo-first by default so public proof generation does not depend on local sessions', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-proof-pack-repo-first-'));
    const outputPath = path.join(rootDir, 'contextforge-proof-pack.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'proof-pack', '--output', outputPath]);
    const proof = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(proof).toContain('| Sessions | 0 records | 0 total tokens, 0.0% cache hit ratio |');
    await rm(rootDir, { recursive: true, force: true });
  });

  it('writes a proof pack that combines doctor and audit evidence for sharing', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-proof-pack-'));
    const outputPath = path.join(rootDir, 'contextforge-proof-pack.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'proof-pack', '--demo', '--output', outputPath]);
    const proof = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(proof).toContain('# ContextForge Proof Pack');
    expect(proof).toContain('## Readiness Snapshot');
    expect(proof).toContain('| Doctor |');
    expect(proof).toContain('| Audit |');
    expect(proof).toContain('## Evidence Commands');
    expect(proof).toContain('contextforge doctor --summary contextforge-doctor.md');
    expect(proof).toContain('contextforge audit --summary contextforge-summary.md');
    expect(proof).toContain('## Codex / Claude Handoff');
    await rm(rootDir, { recursive: true, force: true });
  });
});

describe('CLI review-kit command', () => {
  it('writes a deterministic review kit in demo mode', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-review-kit-'));
    const outputPath = path.join(rootDir, 'contextforge-review-kit.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'review-kit', '--demo', '--output', outputPath, '--base', 'main']);
    const kit = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(kit).toContain('# ContextForge Review Kit');
    expect(kit).toContain('| Base ref | `main` |');
    expect(kit).toContain('## Codex / Claude Review Prompt');
    expect(kit).toContain('contextforge-proof-pack.md');
    await rm(rootDir, { recursive: true, force: true });
  });
});
