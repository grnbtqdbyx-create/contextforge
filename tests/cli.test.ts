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
        force: false,
        actionRef: undefined,
        projectName: undefined,
        minContextScore: 60,
        minCacheScore: 60,
        minSecurityScore: 60,
        maxFiles: 7,
        maxFileBytes: 1024
      })
    ).toEqual({
      demo: false,
      maxFiles: 7,
      maxFileBytes: 1024
    });
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
    expect(result.checks.some((check) => check.name === 'Community health surfaces')).toBe(true);
    expect(result.nextActions.length).toBeGreaterThan(0);
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
