import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('package metadata', () => {
  it('uses npm-normalized bin metadata for the contextforge CLI', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      bin: Record<string, string>;
      packageManager: string;
      files: string[];
      repository?: { type?: string; url?: string };
      homepage?: string;
      bugs?: { url?: string };
    };

    expect(pkg.bin.contextforge).toBe('dist/cli.js');
    expect(pkg.packageManager).toBe('pnpm@11.2.2');
    expect(pkg.files).toContain('contextforge-publish-readiness.md');
    expect(pkg.files).toContain('contextforge-scorecard.md');
    expect(pkg.files).toContain('contextforge-mcp-audit.md');
    expect(pkg.files).toContain('contextforge-claude-audit.md');
    expect(pkg.files).toContain('contextforge-trace-audit.md');
    expect(pkg.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/grnbtqdbyx-create/contextforge.git'
    });
    expect(pkg.homepage).toBe('https://github.com/grnbtqdbyx-create/contextforge#readme');
    expect(pkg.bugs).toEqual({ url: 'https://github.com/grnbtqdbyx-create/contextforge/issues' });
  });
});
