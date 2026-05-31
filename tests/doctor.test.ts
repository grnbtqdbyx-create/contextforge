import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDoctorSummary, formatDoctor, runDoctor } from '../src/doctor/doctor.js';

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
    await writeFile(path.join(rootDir, 'examples/review-kit.md'), '# Review Kit\n');
    await mkdir(path.join(rootDir, 'assets'), { recursive: true });
    await writeFile(path.join(rootDir, 'assets/demo-terminal.svg'), '<svg />\n');
    await writeFile(path.join(rootDir, 'assets/contextforge-report.png'), 'png\n');
    await mkdir(path.join(rootDir, 'docs'), { recursive: true });
    await writeFile(path.join(rootDir, 'docs/launch-post.md'), '# Launch Kit\n');
    await writeFile(path.join(rootDir, 'docs/comparison.md'), '# Comparison\n');
    await writeFile(path.join(rootDir, 'CODE_OF_CONDUCT.md'), '# Code of Conduct\n');
    await writeFile(path.join(rootDir, 'SECURITY.md'), '# Security\n');
    await mkdir(path.join(rootDir, '.github/ISSUE_TEMPLATE'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/ISSUE_TEMPLATE/bug_report.md'), '---\nname: Bug report\nabout: Report something broken\n---\n');
    await writeFile(path.join(rootDir, '.github/ISSUE_TEMPLATE/feature_request.md'), '---\nname: Feature request\nabout: Suggest an improvement\n---\n');
    await writeFile(path.join(rootDir, '.github/PULL_REQUEST_TEMPLATE.md'), '## What changed\n');
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
      'Public proof surfaces',
      'Launch profile surfaces',
      'Community health surfaces'
    ]);
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(result.checks.find((check) => check.name === 'Public proof surfaces')?.detail).toContain('examples/review-kit.md present');
    expect(formatDoctor(result)).toContain('ContextForge doctor: pass');
    expect(createDoctorSummary(result)).toContain('# ContextForge Doctor');
    expect(createDoctorSummary(result)).toContain('| Check | Status | Detail |');
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

  it('warns when community health surfaces are missing', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-community-health-'));
    await writeFile(path.join(rootDir, 'README.md'), '# Test project\n');

    const result = await runDoctor({
      rootDir,
      records: [],
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });

    const communityCheck = result.checks.find((check) => check.name === 'Community health surfaces');

    expect(communityCheck?.status).toBe('warn');
    expect(communityCheck?.detail).toContain('missing CODE_OF_CONDUCT.md');
    expect(result.nextActions).toContain('Add code of conduct, security policy, issue templates, and pull request template so contributors know how to collaborate safely.');
  });

  it('warns when launch profile surfaces are missing', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-launch-profile-'));
    await writeFile(path.join(rootDir, 'README.md'), '# Test project\n');

    const result = await runDoctor({
      rootDir,
      records: [],
      minContextScore: 60,
      minCacheScore: 60,
      minSecurityScore: 60
    });

    const launchCheck = result.checks.find((check) => check.name === 'Launch profile surfaces');

    expect(launchCheck?.status).toBe('warn');
    expect(launchCheck?.detail).toContain('missing demo-terminal.svg');
    expect(result.nextActions).toContain('Add demo assets, launch kit, and comparison guide so visitors can understand and share the project quickly.');
  });
});
