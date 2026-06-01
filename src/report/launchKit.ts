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
    'contextforge adoption-brief --output docs/adoption.md',
    'contextforge doctor --summary contextforge-doctor.md',
    'contextforge artifact-map --output docs/artifacts.md',
    'contextforge review-kit --base main --output contextforge-review-kit.md',
    'contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif',
    'contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif',
    'contextforge trace-audit --demo --summary contextforge-trace-audit.md',
    'contextforge cost-estimate --demo --summary contextforge-cost-estimate.md --input-price-per-mtok 2 --cached-input-price-per-mtok 0.2 --output-price-per-mtok 10',
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
    `${projectName} turns that layer into a deterministic readiness check for Codex and Claude Code: context health, cache stability, trace efficiency, prompt-injection safety, review kits, public proof files, community health files, CI artifacts, and task-specific context packs.`,
    '',
    'Try the proof path:',
    '',
    '```bash',
    'contextforge doctor --summary contextforge-doctor.md',
    'contextforge artifact-map --output docs/artifacts.md',
    '```',
    '',
    `Repo: ${repoUrl}`,
    '',
    'If this helps your agent work with less waste and better handoffs, a star helps more maintainers find it.',
    '',
    '## Maintainer Checklist',
    '',
    '- README explains the problem in the first screen.',
    '- `contextforge adoption-brief --output docs/adoption.md` gives evaluators the first 30-second decision path.',
    '- `contextforge doctor --summary` produces a shareable readiness report.',
    '- `contextforge artifact-map --output docs/artifacts.md` tells visitors which proof artifact to inspect first.',
    '- `contextforge mcp-audit --sarif contextforge-mcp.sarif` makes MCP config risk visible in GitHub Code Scanning.',
    '- `contextforge claude-audit --sarif contextforge-claude.sarif` makes Claude Code project settings risk visible in GitHub Code Scanning.',
    '- `contextforge trace-audit --summary contextforge-trace-audit.md` shows repeated tool calls, large outputs, and cache reuse from Codex or Claude traces.',
    '- `contextforge cost-estimate --summary contextforge-cost-estimate.md` turns observed tokens into a configurable spend estimate.',
    '- GitHub topics match the target audience.',
    '- Release notes include validation commands.',
    '- Open issues show what contributors can help with next.',
    ''
  ];
  return `${lines.join('\n')}\n`;
}
