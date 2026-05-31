import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
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
        sessions: true,
        json: false,
        write: false,
        openPr: false,
        githubAction: false,
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
    expect(result.nextActions.length).toBeGreaterThan(0);
  });
});
