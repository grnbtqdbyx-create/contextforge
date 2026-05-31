import { execFile } from 'node:child_process';
import { chmod, mkdtemp, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('package bin entrypoint', () => {
  it('runs when invoked through a package-manager symlink', async () => {
    await execFileAsync('pnpm', ['build']);
    await chmod('dist/cli.js', 0o755);
    const binDir = await mkdtemp(path.join(os.tmpdir(), 'contextforge-bin-'));
    const binPath = path.join(binDir, 'contextforge');
    await symlink(path.resolve('dist/cli.js'), binPath);

    const { stdout } = await execFileAsync('node', [binPath, 'doctor', '--demo']);

    expect(stdout).toContain('ContextForge doctor');
  });
});
