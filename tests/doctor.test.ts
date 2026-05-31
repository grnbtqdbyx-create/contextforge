import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDoctor, runDoctor } from '../src/doctor/doctor.js';

describe('doctor readiness report', () => {
  it('summarizes audit, benchmark, workflow, and next-action readiness', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-doctor-'));
    await mkdir(path.join(rootDir, '.github/workflows'), { recursive: true });
    await writeFile(path.join(rootDir, 'AGENTS.md'), 'Keep instructions short, explicit, and reviewed.\n');
    await writeFile(path.join(rootDir, 'CLAUDE.md'), 'Use repo-local context and avoid unrelated files.\n');
    await writeFile(path.join(rootDir, 'README.md'), '# Test project\n');
    await writeFile(path.join(rootDir, 'LICENSE'), 'Apache-2.0\n');
    await writeFile(path.join(rootDir, 'CONTRIBUTING.md'), '# Contributing\n');
    await writeFile(path.join(rootDir, 'CHANGELOG.md'), '# Changelog\n');
    await writeFile(path.join(rootDir, 'llms.txt'), '# Test project\n');
    await writeFile(path.join(rootDir, 'llms-full.txt'), '# Test project full context\n');
    await mkdir(path.join(rootDir, 'examples'), { recursive: true });
    await writeFile(path.join(rootDir, 'examples/demo-output.md'), '# Demo output\n');
    await writeFile(path.join(rootDir, 'examples/pr-comment.md'), '# PR comment\n');
    await writeFile(path.join(rootDir, '.github/workflows/ci.yml'), 'name: CI\n');
    await writeFile(path.join(rootDir, '.github/workflows/contextforge-audit.yml'), 'name: ContextForge Audit\n');

    const result = await runDoctor({
      rootDir,
      records: [],
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });

    expect(result.status).toBe('pass');
    expect(result.checks.map((check) => check.name)).toEqual([
      'Context health',
      'Cache stability',
      'Context security',
      'Security benchmark',
      'GitHub workflows',
      'Public proof surfaces'
    ]);
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(formatDoctor(result)).toContain('ContextForge doctor: pass');
  });

  it('warns when public proof surfaces are missing', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-public-proof-'));
    await writeFile(path.join(rootDir, 'AGENTS.md'), 'Keep instructions short, explicit, and reviewed.\n');

    const result = await runDoctor({
      rootDir,
      records: [],
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });

    const proofCheck = result.checks.find((check) => check.name === 'Public proof surfaces');

    expect(proofCheck?.status).toBe('warn');
    expect(proofCheck?.detail).toContain('missing README.md');
    expect(result.nextActions).toContain('Add README, license, contribution, changelog, demo, and LLM discovery surfaces so visitors and agents can verify the project quickly.');
  });
});
