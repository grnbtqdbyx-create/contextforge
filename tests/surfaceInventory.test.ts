import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { createAgentSurfaceInventory, createAgentSurfaceInventoryMarkdown } from '../src/report/agentSurfaceInventory.js';

const execFileAsync = promisify(execFile);

describe('agent surface inventory', () => {
  it('lists actual repo agent-readable surfaces and skips fixtures and tests', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-surface-inventory-'));
    await mkdir(path.join(rootDir, '.github'), { recursive: true });
    await mkdir(path.join(rootDir, '.cursor/rules'), { recursive: true });
    await mkdir(path.join(rootDir, '.clinerules'), { recursive: true });
    await mkdir(path.join(rootDir, '.windsurf/rules'), { recursive: true });
    await mkdir(path.join(rootDir, 'fixtures'), { recursive: true });
    await mkdir(path.join(rootDir, 'tests'), { recursive: true });
    await writeFile(path.join(rootDir, 'README.md'), '# Demo\n');
    await writeFile(path.join(rootDir, 'AGENTS.md'), 'Use tests.\n');
    await writeFile(path.join(rootDir, 'GEMINI.md'), 'Use Gemini context.\n');
    await writeFile(path.join(rootDir, '.github/copilot-instructions.md'), 'Use pnpm.\n');
    await writeFile(path.join(rootDir, '.cursor/rules/review.mdc'), 'Review safely.\n');
    await writeFile(path.join(rootDir, '.clinerules/security.md'), 'Check secrets.\n');
    await writeFile(path.join(rootDir, '.windsurf/rules/frontend.md'), 'Use accessible UI.\n');
    await writeFile(path.join(rootDir, '.mcp.json'), '{"mcpServers":{}}\n');
    await writeFile(path.join(rootDir, 'fixtures/AGENTS.md'), 'Fixture only.\n');
    await writeFile(path.join(rootDir, 'tests/AGENTS.md'), 'Test only.\n');

    const inventory = await createAgentSurfaceInventory({ rootDir });
    const markdown = createAgentSurfaceInventoryMarkdown(inventory);

    expect(inventory.totalFiles).toBe(8);
    expect(inventory.surfaces.map((surface) => surface.path)).toEqual([
      '.clinerules/security.md',
      '.cursor/rules/review.mdc',
      '.github/copilot-instructions.md',
      '.mcp.json',
      '.windsurf/rules/frontend.md',
      'AGENTS.md',
      'GEMINI.md',
      'README.md'
    ]);
    expect(inventory.surfaces.some((surface) => surface.path === 'fixtures/AGENTS.md')).toBe(false);
    expect(inventory.surfaces.some((surface) => surface.path === 'tests/AGENTS.md')).toBe(false);
    expect(markdown).toContain('# ContextForge Agent Surface Inventory');
    expect(markdown).toContain('| GitHub Copilot | 1 | `.github/copilot-instructions.md` |');
    expect(markdown).toContain('| MCP tool configs | 1 | `.mcp.json` |');
    expect(markdown).toContain('| `AGENTS.md` | OpenAI Codex | `contextforge agents-md-audit`, `contextforge security-audit`, `contextforge pack` |');
  });

  it('writes the inventory from the CLI', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-surface-inventory-cli-'));
    const outputPath = path.join(rootDir, 'surface-inventory.md');

    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'surface-inventory', '--output', outputPath]);
    const markdown = await readFile(outputPath, 'utf8');

    expect(stdout).toContain(`Wrote ${outputPath}`);
    expect(markdown).toContain('# ContextForge Agent Surface Inventory');
    expect(markdown).toContain('## Detected Surfaces');
  });

  it('prints machine-readable inventory JSON from the CLI', async () => {
    const { stdout } = await execFileAsync('pnpm', ['contextforge', 'surface-inventory', '--json']);
    const inventory = JSON.parse(stdout) as { totalFiles: number; surfaces: Array<{ path: string; ecosystem: string; coverage: string[] }> };

    expect(inventory.totalFiles).toBeGreaterThan(0);
    expect(inventory.surfaces.some((surface) => surface.path === 'README.md')).toBe(true);
    expect(inventory.surfaces.every((surface) => Array.isArray(surface.coverage))).toBe(true);
  });
});
