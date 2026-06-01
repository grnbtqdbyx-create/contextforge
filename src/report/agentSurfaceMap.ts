interface AgentSurfaceRow {
  ecosystem: string;
  surface: string;
  whyItMatters: string;
  coverage: string;
  source: string;
}

const rows: AgentSurfaceRow[] = [
  {
    ecosystem: 'OpenAI Codex',
    surface: '`AGENTS.md`, `CLAUDE.md`, root `README.md`, MCP config files',
    whyItMatters: 'Codex and other coding agents need concise repo guidance, safe local tool access, and predictable context before long tasks.',
    coverage: '`contextforge agents-md-audit`, `contextforge security-audit`, `contextforge mcp-audit`, `contextforge pack`',
    source: '[OpenAI code generation](https://platform.openai.com/docs/guides/code-generation), [OpenAI Docs MCP](https://platform.openai.com/docs/docs-mcp)'
  },
  {
    ecosystem: 'Claude Code',
    surface: '`CLAUDE.md`, `.claude/settings*.json`, `.claude/skills/*/SKILL.md`, `.claude/agents/**/*.md`, `.claude/commands/**/*.md`',
    whyItMatters: 'Claude Code reads project memory, settings, skills, subagents, and command prompts from committed repo files that can affect permissions, tool use, and context cost.',
    coverage: '`contextforge claude-audit`, `contextforge security-audit`, `contextforge agents-md-audit`, `contextforge pack`',
    source: '[Claude .claude directory](https://code.claude.com/docs/en/claude-directory), [Claude subagents](https://code.claude.com/docs/en/sub-agents), [Claude skills](https://code.claude.com/docs/en/slash-commands)'
  },
  {
    ecosystem: 'GitHub Copilot',
    surface: '`.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`, `.github/prompts/**/*.prompt.md`, `.github/agents/**/*.md`, `.github/hooks/*.json`, `.github/copilot/settings*.json`, `.vscode/settings.json`, `*.code-workspace`',
    whyItMatters: 'Copilot customization can add always-on instructions, reusable prompts, custom agents, hooks, and workspace instruction text that reviewers may miss.',
    coverage: '`contextforge security-audit`, `contextforge agents-md-audit`, `contextforge pack`, GitHub Actions SARIF upload',
    source: '[GitHub Copilot custom agents](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-custom-agents), GitHub Copilot customization docs'
  },
  {
    ecosystem: 'MCP tool configs',
    surface: '`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, Claude and Codex MCP config files',
    whyItMatters: 'MCP servers expose tools to agents; committed configs can hide hardcoded secrets, remote shell installers, unpinned packages, auto-approval, broad permissions, or symlinks.',
    coverage: '`contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif`',
    source: '[OpenAI Docs MCP](https://platform.openai.com/docs/docs-mcp), Claude MCP docs, GitHub MCP docs'
  },
  {
    ecosystem: 'Cursor and Cline-style agents',
    surface: '`.cursorrules`, `.clinerules`, MCP config files, root repo instructions',
    whyItMatters: 'Adjacent coding agents often consume repo-local rule files and tool configs that can become stale, broad, or unsafe.',
    coverage: '`contextforge security-audit`, `contextforge mcp-audit`, `contextforge pack`',
    source: 'Adjacent tool research in `docs/research/adjacent-tools.md`'
  }
];

export function createAgentSurfaceMap(): string {
  const lines = [
    '# ContextForge Agent Surface Map',
    '',
    'Use this map when deciding whether a repository is ready for Codex, Claude Code, GitHub Copilot, or adjacent coding agents.',
    'It shows which repo-level prompt, settings, tool, and workflow surfaces ContextForge keeps inside a deterministic audit loop.',
    '',
    '## Supported Surfaces',
    '',
    '| Agent ecosystem | Repo surface | Why it matters | ContextForge coverage |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.ecosystem} | ${row.surface} | ${row.whyItMatters} | ${row.coverage} |`),
    '',
    '## Research Anchors',
    '',
    ...rows.map((row) => `- ${row.ecosystem}: ${row.source}`),
    '',
    '## Suggested CI Gate',
    '',
    '```bash',
    'contextforge audit --min-context-score 70 --min-cache-score 70 --min-security-score 80 --sarif contextforge.sarif --summary contextforge-summary.md',
    'contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif',
    'contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif',
    'contextforge surface-map --output contextforge-agent-surface-map.md',
    '```',
    '',
    '## Maintainer Rule',
    '',
    'If an agent reads it as instruction, settings, tools, hooks, command prompts, or reusable workflow context, keep it short, reviewed, and covered by CI.',
    ''
  ];
  return `${lines.join('\n')}\n`;
}
