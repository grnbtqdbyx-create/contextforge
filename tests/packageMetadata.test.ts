import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('package metadata', () => {
  it('uses npm-normalized bin metadata for the contextforge CLI', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      bin: Record<string, string>;
    };

    expect(pkg.bin.contextforge).toBe('dist/cli.js');
  });
});
