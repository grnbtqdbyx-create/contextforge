import { describe, expect, it } from 'vitest';
import { scannerOptionsFromArgs } from '../src/cli.js';

describe('CLI argument mapping', () => {
  it('forwards bounded session scan options to scanners', () => {
    expect(
      scannerOptionsFromArgs({
        command: 'scan',
        demo: false,
        codex: true,
        claude: false,
        task: 'x',
        budget: 100,
        output: 'out',
        report: 'report',
        benchmarkDir: undefined,
        sessions: true,
        write: false,
        openPr: false,
        minContextScore: 60,
        minCacheScore: 60,
        minSecurityScore: 60,
        maxFiles: 7,
        maxFileBytes: 1024
      })
    ).toEqual({
      demo: false,
      maxFiles: 7,
      maxFileBytes: 1024
    });
  });
});
