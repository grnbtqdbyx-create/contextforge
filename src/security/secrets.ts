import path from 'node:path';

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/(OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|API_KEY|SECRET|TOKEN)=([^\s"'`]+)/gi, '$1=[REDACTED_SECRET]'],
  [/sk-[A-Za-z0-9_-]{8,}/g, '[REDACTED_OPENAI_KEY]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]']
];

const IGNORED_SEGMENTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'DerivedData',
  '.next',
  '.turbo'
]);

const IGNORED_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock'
]);

export function redactSecrets(content: string): string {
  return SECRET_PATTERNS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), content);
}

export function shouldIgnorePath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join('/');
  const segments = normalized.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  return IGNORED_BASENAMES.has(path.basename(filePath));
}

export function isLikelyBinary(buffer: Buffer): boolean {
  return buffer.includes(0);
}

