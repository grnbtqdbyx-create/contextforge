# ContextForge Agent Surface Map

Use this map when deciding whether a repository is ready for Codex, Claude Code, GitHub Copilot, or adjacent coding agents.
It shows which repo-level prompt, settings, tool, and workflow surfaces ContextForge keeps inside a deterministic audit loop.

## Supported Surfaces

| Agent ecosystem | Repo surface | Why it matters | ContextForge coverage |
| --- | --- | --- | --- |
| OpenAI Codex | `AGENTS.md`, `CLAUDE.md`, root `README.md`, MCP config files | Codex and other coding agents need concise repo guidance, safe local tool access, and predictable context before long tasks. | `contextforge agents-md-audit`, `contextforge security-audit`, `contextforge mcp-audit`, `contextforge pack` |
| Claude Code | `CLAUDE.md`, `.claude/settings*.json`, `.claude/skills/*/SKILL.md`, `.claude/agents/**/*.md`, `.claude/commands/**/*.md` | Claude Code reads project memory, settings, skills, subagents, and command prompts from committed repo files that can affect permissions, tool use, and context cost. | `contextforge claude-audit`, `contextforge security-audit`, `contextforge agents-md-audit`, `contextforge pack` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`, `.github/prompts/**/*.prompt.md`, `.github/agents/**/*.md`, `.github/hooks/*.json`, `.github/copilot/settings*.json`, `.vscode/settings.json`, `*.code-workspace` | Copilot customization can add always-on instructions, reusable prompts, custom agents, hooks, and workspace instruction text that reviewers may miss. | `contextforge security-audit`, `contextforge agents-md-audit`, `contextforge pack`, GitHub Actions SARIF upload |
| MCP tool configs | `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, Claude and Codex MCP config files | MCP servers expose tools to agents; committed configs can hide hardcoded secrets, remote shell installers, unpinned packages, auto-approval, broad permissions, or symlinks. | `contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif` |
| Cursor and Cline-style agents | `.cursorrules`, `.clinerules`, MCP config files, root repo instructions | Adjacent coding agents often consume repo-local rule files and tool configs that can become stale, broad, or unsafe. | `contextforge security-audit`, `contextforge mcp-audit`, `contextforge pack` |

## Research Anchors

- OpenAI Codex: [OpenAI code generation](https://platform.openai.com/docs/guides/code-generation), [OpenAI Docs MCP](https://platform.openai.com/docs/docs-mcp)
- Claude Code: [Claude .claude directory](https://code.claude.com/docs/en/claude-directory), [Claude subagents](https://code.claude.com/docs/en/sub-agents), [Claude skills](https://code.claude.com/docs/en/slash-commands)
- GitHub Copilot: [GitHub Copilot custom agents](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-custom-agents), GitHub Copilot customization docs
- MCP tool configs: [OpenAI Docs MCP](https://platform.openai.com/docs/docs-mcp), Claude MCP docs, GitHub MCP docs
- Cursor and Cline-style agents: Adjacent tool research in `docs/research/adjacent-tools.md`

## Suggested CI Gate

```bash
contextforge audit --min-context-score 70 --min-cache-score 70 --min-security-score 80 --sarif contextforge.sarif --summary contextforge-summary.md
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge surface-map --output contextforge-agent-surface-map.md
```

## Maintainer Rule

If an agent reads it as instruction, settings, tools, hooks, command prompts, or reusable workflow context, keep it short, reviewed, and covered by CI.

