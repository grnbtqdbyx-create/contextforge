import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('agent surface map', () => {
  it('writes a Markdown support matrix for audited agent surfaces', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-agent-surface-map-'));
    const outputPath = path.join(rootDir, 'agent-surface-map.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'surface-map', '--output', outputPath]);
    const markdown = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(markdown).toContain('# ContextForge Agent Surface Map');
    expect(markdown).toContain('| Agent ecosystem | Repo surface | Why it matters | ContextForge coverage |');
    expect(markdown).toContain('OpenAI Codex');
    expect(markdown).toContain('`AGENTS.md`');
    expect(markdown).toContain('Claude Code');
    expect(markdown).toContain('`.claude/agents/**/*.md`');
    expect(markdown).toContain('`.claude/commands/**/*.md`');
    expect(markdown).toContain('GitHub Copilot');
    expect(markdown).toContain('`.github/prompts/**/*.prompt.md`');
    expect(markdown).toContain('MCP tool configs');
    expect(markdown).toContain('`contextforge security-audit`');
    expect(markdown).toContain('`contextforge mcp-audit`');
    expect(markdown).toContain('## Suggested CI Gate');

    await rm(rootDir, { recursive: true, force: true });
  });
});
