import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { createDemoOutput } from '../src/report/demoOutput.js';

const execFileAsync = promisify(execFile);

describe('demo output', () => {
  it('creates public-facing markdown from deterministic demo data', async () => {
    const markdown = await createDemoOutput();

    expect(markdown).toContain('# ContextForge Demo Output');
    expect(markdown).toContain('## Token Usage');
    expect(markdown).toContain('Total tokens:');
    expect(markdown).toContain('## CI Audit');
    expect(markdown).toContain('ContextForge audit: pass');
    expect(markdown).toContain('## Agent Handoff');
    expect(markdown).toContain('contextforge plan');
  });

  it('writes demo output from the CLI', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-examples-'));
    const outputPath = path.join(rootDir, 'nested', 'demo-output.md');
    const tsxPath = path.resolve('node_modules/.bin/tsx');
    const cliPath = path.resolve('src/cli.ts');

    const { stdout } = await execFileAsync(tsxPath, [
      cliPath,
      'examples',
      '--output',
      outputPath
    ]);
    const markdown = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(markdown).toContain('# ContextForge Demo Output');
    expect(markdown).toContain('ContextForge audit: pass');
    await rm(rootDir, { recursive: true, force: true });
  });
});
