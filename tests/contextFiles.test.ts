import { describe, expect, it } from 'vitest';
import { listSecurityContextFiles } from '../src/utils/contextFiles.js';

describe('context file discovery', () => {
  it('skips repository fixture and test context files during repo-root scans', async () => {
    const files = await listSecurityContextFiles(process.cwd());

    expect(files.some((file) => file.relativePath.startsWith('fixtures/security-benchmark/'))).toBe(false);
    expect(files.some((file) => file.relativePath.startsWith('tests/'))).toBe(false);
  });
});
