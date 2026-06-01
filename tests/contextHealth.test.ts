import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditContextFiles } from '../src/analyzers/contextHealth.js';

describe('context health audit', () => {
  it('flags vague and repeated repo-level instructions', async () => {
    const audit = await auditContextFiles({ rootDir: 'fixtures/project' });
    expect(audit.files.length).toBeGreaterThan(0);
    expect(audit.score).toBeLessThan(100);
    expect(audit.findings.some((finding) => finding.type === 'repetition')).toBe(true);
    expect(audit.findings.some((finding) => finding.type === 'vague')).toBe(true);
  });

  it('discovers nested agent instruction files in monorepos', async () => {
    const audit = await auditContextFiles({ rootDir: 'fixtures/monorepo-project' });

    expect(audit.files.some((file) => file.path === 'AGENTS.md')).toBe(true);
    expect(audit.files.some((file) => file.path === 'packages/api/AGENTS.md')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === 'packages/api/AGENTS.md' && finding.type === 'vague')).toBe(true);
  });

  it('audits GitHub Copilot instruction files as repo context', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-health-'));
    await mkdir(path.join(rootDir, '.github/instructions'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/copilot-instructions.md'), 'Always be careful. Always be careful.\n');
    await writeFile(path.join(rootDir, '.github/instructions/frontend.instructions.md'), 'Use best practices perfectly.\n');

    const audit = await auditContextFiles({ rootDir });

    expect(audit.files.map((file) => file.path)).toEqual([
      '.github/copilot-instructions.md',
      '.github/instructions/frontend.instructions.md'
    ]);
    expect(audit.findings.some((finding) => finding.file === '.github/copilot-instructions.md' && finding.type === 'repetition')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === '.github/instructions/frontend.instructions.md' && finding.type === 'vague')).toBe(true);
  });

  it('flags path-scoped Copilot instructions without applyTo frontmatter', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-applyto-'));
    await mkdir(path.join(rootDir, '.github/instructions'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/instructions/frontend.instructions.md'), 'Use React Query for server state.\n');
    await writeFile(
      path.join(rootDir, '.github/instructions/api.instructions.md'),
      ['---', 'applyTo: "src/api/**/*.ts"', '---', 'Validate request bodies with Zod.'].join('\n')
    );

    const audit = await auditContextFiles({ rootDir });

    expect(audit.findings).toContainEqual(
      expect.objectContaining({
        file: '.github/instructions/frontend.instructions.md',
        type: 'copilot-missing-applyto',
        severity: 'medium'
      })
    );
    expect(
      audit.findings.some((finding) => finding.file === '.github/instructions/api.instructions.md' && finding.type === 'copilot-missing-applyto')
    ).toBe(false);
  });

  it('audits Copilot prompts, custom agents, and project skills as repo context', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-copilot-artifact-health-'));
    await mkdir(path.join(rootDir, '.github/prompts'), { recursive: true });
    await mkdir(path.join(rootDir, '.github/agents'), { recursive: true });
    await mkdir(path.join(rootDir, '.github/skills/release'), { recursive: true });
    await writeFile(path.join(rootDir, '.github/prompts/review.prompt.md'), 'Always be careful. Always be careful.\n');
    await writeFile(path.join(rootDir, '.github/agents/reviewer.agent.md'), 'Use best practices perfectly.\n');
    await writeFile(path.join(rootDir, '.github/skills/release/SKILL.md'), 'Do everything perfectly.\n');

    const audit = await auditContextFiles({ rootDir });

    expect(audit.files.map((file) => file.path)).toEqual([
      '.github/agents/reviewer.agent.md',
      '.github/prompts/review.prompt.md',
      '.github/skills/release/SKILL.md'
    ]);
    expect(audit.findings.some((finding) => finding.file === '.github/prompts/review.prompt.md' && finding.type === 'repetition')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === '.github/agents/reviewer.agent.md' && finding.type === 'vague')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === '.github/skills/release/SKILL.md' && finding.type === 'vague')).toBe(true);
  });

  it('audits Claude Code subagents and custom slash commands as repo context', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-claude-artifact-health-'));
    await mkdir(path.join(rootDir, '.claude/agents'), { recursive: true });
    await mkdir(path.join(rootDir, '.claude/commands'), { recursive: true });
    await writeFile(path.join(rootDir, '.claude/agents/reviewer.md'), 'Use best practices perfectly.\n');
    await writeFile(path.join(rootDir, '.claude/commands/release.md'), 'Always be careful. Always be careful.\n');

    const audit = await auditContextFiles({ rootDir });

    expect(audit.files.map((file) => file.path)).toEqual([
      '.claude/agents/reviewer.md',
      '.claude/commands/release.md'
    ]);
    expect(audit.findings.some((finding) => finding.file === '.claude/agents/reviewer.md' && finding.type === 'vague')).toBe(true);
    expect(audit.findings.some((finding) => finding.file === '.claude/commands/release.md' && finding.type === 'repetition')).toBe(true);
  });
});
