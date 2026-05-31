import { describe, expect, it } from 'vitest';
import { createContextPack } from '../src/pack/contextPack.js';

describe('context pack generator', () => {
  it('creates a budgeted pack and excludes secrets', async () => {
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'fix auth bug',
      budget: 300
    });
    expect(pack.files.some((file) => file.path.endsWith('src/auth.ts'))).toBe(true);
    expect(pack.content).not.toContain('sk-should-not-appear');
    expect(pack.estimatedTokens).toBeLessThanOrEqual(300);
  });
});
