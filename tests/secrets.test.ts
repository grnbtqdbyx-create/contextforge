import { describe, expect, it } from 'vitest';
import { redactSecrets, shouldIgnorePath } from '../src/security/secrets.js';

describe('secret protection', () => {
  it('redacts common credentials from content', () => {
    const redacted = redactSecrets('OPENAI_API_KEY=sk-test-secret');
    expect(redacted).not.toContain('sk-test-secret');
    expect(redacted).toContain('[REDACTED');
  });

  it('does not redact ordinary words that contain sk-dash fragments', () => {
    expect(redactSecrets('task-term-match path-match')).toContain('task-term-match');
  });

  it('ignores secret and build artifact paths by default', () => {
    expect(shouldIgnorePath('/repo/.env')).toBe(true);
    expect(shouldIgnorePath('/repo/node_modules/pkg/index.js')).toBe(true);
    expect(shouldIgnorePath('/repo/src/index.ts')).toBe(false);
  });
});
