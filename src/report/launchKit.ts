export interface LaunchKitOptions {
  projectName: string;
  repoUrl: string;
}

const suggestedTopics = [
  'codex',
  'claude-code',
  'coding-agents',
  'context-engineering',
  'token-usage',
  'prompt-caching',
  'ai-security',
  'github-actions'
];

export function createLaunchKit(options: LaunchKitOptions): string {
  const projectName = options.projectName.trim() || 'ContextForge';
  const repoUrl = options.repoUrl.trim() || 'https://github.com/grnbtqdbyx-create/contextforge';
  const lines = [
    `# ${projectName} Launch Kit`,
    '',
    '## One-Liner',
    '',
    `${projectName} is a local-first context readiness gate for Codex and Claude Code repositories.`,
    '',
    '## Proof Commands',
    '',
    '```bash',
    'contextforge doctor --summary contextforge-doctor.md',
    'contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg',
    'contextforge pack --task "review auth regression" --budget 20000 --sessions',
    '```',
    '',
    '## Suggested GitHub Topics',
    '',
    suggestedTopics.map((topic) => `\`${topic}\``).join(' '),
    '',
    '## Launch Post Draft',
    '',
    `I am building ${projectName} in public.`,
    '',
    'AI coding agents are powerful, but repositories still waste their context with noisy instructions, unstable cache prefixes, huge tool outputs, and unsafe Markdown.',
    '',
    `${projectName} turns that layer into a deterministic readiness check for Codex and Claude Code: context health, cache stability, prompt-injection safety, public proof files, community health files, CI artifacts, and task-specific context packs.`,
    '',
    'Try the proof path:',
    '',
    '```bash',
    'contextforge doctor --summary contextforge-doctor.md',
    '```',
    '',
    `Repo: ${repoUrl}`,
    '',
    'If this helps your agent work with less waste and better handoffs, a star helps more maintainers find it.',
    '',
    '## Maintainer Checklist',
    '',
    '- README explains the problem in the first screen.',
    '- `contextforge doctor --summary` produces a shareable readiness report.',
    '- GitHub topics match the target audience.',
    '- Release notes include validation commands.',
    '- Open issues show what contributors can help with next.',
    ''
  ];
  return `${lines.join('\n')}\n`;
}
