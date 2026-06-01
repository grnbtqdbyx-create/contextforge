import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('LLM discovery docs', () => {
  it('provides a concise root llms.txt map for coding agents', async () => {
    const llms = await readFile('llms.txt', 'utf8');

    expect(llms).toContain('# ContextForge');
    expect(llms).toContain('> Agent context gate for Codex, Claude Code, GitHub Copilot, MCP, Cursor, and Cline-style repos.');
    expect(llms).toContain('## Quick Start');
    expect(llms).toContain('contextforge init --all');
    expect(llms).toContain('[Full Context](llms-full.txt)');
  });

  it('provides an expanded llms-full.txt context file', async () => {
    const full = await readFile('llms-full.txt', 'utf8');

    expect(full).toContain('# ContextForge Full Context');
    expect(full).toContain('## What ContextForge Does');
    expect(full).toContain('## Commands');
    expect(full).toContain('## Safety Model');
  });

  it('ships LLM discovery docs in the npm package', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      files: string[];
    };

    expect(pkg.files).toContain('llms.txt');
    expect(pkg.files).toContain('llms-full.txt');
  });
});
