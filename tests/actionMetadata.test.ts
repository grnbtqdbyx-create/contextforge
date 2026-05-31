import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('GitHub Action metadata', () => {
  it('defines a reusable composite action for running ContextForge audit', async () => {
    const action = await readFile('action.yml', 'utf8');

    expect(action).toContain("using: 'composite'");
    expect(action).toContain('min-context-score:');
    expect(action).toContain('min-cache-score:');
    expect(action).toContain('min-security-score:');
    expect(action).toContain('sarif:');
    expect(action).toContain('summary:');
    expect(action).toContain('plan:');
    expect(action).toContain('comment:');
    expect(action).toContain('suggestions:');
    expect(action).toContain('badge:');
    expect(action).toContain('proof-pack:');
    expect(action).toContain('agent-action-plan:');
    expect(action).toContain('pr-comment:');
    expect(action).toContain('suggestions-json:');
    expect(action).toContain('badge-svg:');
    expect(action).toContain('proof-pack-md:');
    expect(action).toContain('GITHUB_ACTION_PATH');
    expect(action).toContain('GITHUB_WORKSPACE');
    expect(action).toContain('GITHUB_STEP_SUMMARY');
    expect(action).toContain('npm exec --yes --package pnpm@11.2.2');
    expect(action).toContain('--sarif');
    expect(action).toContain('--summary');
    expect(action).toContain('--plan');
    expect(action).toContain('--comment');
    expect(action).toContain('--suggestions');
    expect(action).toContain('--badge');
    expect(action).toContain('node \"$GITHUB_ACTION_PATH/dist/cli.js\" proof-pack');
    expect(action).toContain('if: always()');
    expect(action).toContain('node \"$GITHUB_ACTION_PATH/dist/cli.js\" audit');
  });
});
