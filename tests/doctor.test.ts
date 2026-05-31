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
      'GitHub workflows'
    ]);
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(formatDoctor(result)).toContain('ContextForge doctor: pass');
  });
});
