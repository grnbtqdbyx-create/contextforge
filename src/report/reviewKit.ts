export interface ReviewKitOptions {
  projectName: string;
  baseRef: string;
  changedFiles: string[];
}

const demoChangedFiles = [
  'README.md',
  '.github/workflows/contextforge-audit.yml',
  'src/report/prComment.ts',
  'tests/prComment.test.ts'
];

export function demoReviewKitFiles(): string[] {
  return [...demoChangedFiles];
}

export function reviewFocusForFiles(files: string[]): string[] {
  const focus = new Set<string>();
  const normalized = files.map((file) => file.toLowerCase());

  if (normalized.some((file) => file.endsWith('readme.md') || file.endsWith('agents.md') || file.endsWith('claude.md') || file.includes('llms'))) {
    focus.add('Agent-readable instructions and README entrypoints changed; check for noisy context or prompt-injection risk.');
  }
  if (normalized.some((file) => file.startsWith('.github/workflows/') || file.endsWith('action.yml'))) {
    focus.add('GitHub workflow files changed; verify permissions, artifact paths, and fork-safe behavior.');
  }
  if (normalized.some((file) => file.startsWith('src/') || (/\.(ts|tsx)$/.test(file) && !file.startsWith('tests/') && !file.includes('.test.')))) {
    focus.add('Runtime source changed; verify behavior with focused tests and the built CLI.');
  }
  if (normalized.some((file) => file.startsWith('tests/') || file.includes('.test.'))) {
    focus.add('Tests changed; verify the new expectations fail before implementation and pass after.');
  }
  if (normalized.some((file) => file.startsWith('docs/') || file.endsWith('.md'))) {
    focus.add('Documentation changed; verify public claims match generated artifacts and release evidence.');
  }

  return focus.size > 0 ? [...focus] : ['No changed files detected; verify the branch diff and rerun with the correct --base ref.'];
}

export function createReviewKit(options: ReviewKitOptions): string {
  const projectName = options.projectName.trim() || 'ContextForge';
  const baseRef = options.baseRef.trim() || 'main';
  const changedFiles = [...new Set(options.changedFiles)].sort();
  const focus = reviewFocusForFiles(changedFiles);
  const fileLines = changedFiles.length > 0 ? changedFiles.map((file) => `- \`${file}\``) : ['- No changed files detected.'];
  const promptFiles = changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`) : ['- No changed files detected.'];

  const lines = [
    `# ${projectName} Review Kit`,
    '',
    '## Review Scope',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Base ref | \`${baseRef}\` |`,
    `| Changed files | ${changedFiles.length} |`,
    '',
    '## Changed Files',
    '',
    ...fileLines,
    '',
    '## Review Focus',
    '',
    ...focus.map((item) => `- ${item}`),
    '',
    '## Evidence Commands',
    '',
    '```bash',
    `contextforge review-kit --base ${baseRef} --output contextforge-review-kit.md`,
    'contextforge doctor --summary contextforge-doctor.md',
    'contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg',
    'contextforge proof-pack --output contextforge-proof-pack.md',
    'pnpm test',
    'pnpm typecheck',
    'pnpm build',
    '```',
    '',
    '## Codex / Claude Review Prompt',
    '',
    '```text',
    'You are reviewing a ContextForge pull request for correctness, safety, and agent usefulness.',
    `Compare the branch against ${baseRef}.`,
    'Read `contextforge-pr-comment.md`, `contextforge-agent-plan.md`, and `contextforge-proof-pack.md` if they exist.',
    'Focus on behavior regressions, security or prompt-injection risk, CI artifact drift, missing tests, and misleading public claims.',
    'Do not approve based only on green tests; verify that tests cover the changed behavior.',
    '',
    'Changed files:',
    ...promptFiles,
    '',
    'Return findings first, ordered by severity, with file and line references where possible.',
    '```',
    ''
  ];

  return `${lines.join('\n')}\n`;
}
