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

  it('explains why each selected file was included', async () => {
    const pack = await createContextPack({
      rootDir: 'fixtures/project',
      task: 'fix auth bug',
      budget: 300
    });
    const authFile = pack.files.find((file) => file.path.endsWith('src/auth.ts'));

    expect(authFile?.reasons.some((reason) => reason.type === 'task-term-match')).toBe(true);
    expect(authFile?.reasons.some((reason) => reason.type === 'path-match')).toBe(true);
    expect(pack.content).toContain('Why included');
    expect(pack.content).toContain('task term');
  });
});
