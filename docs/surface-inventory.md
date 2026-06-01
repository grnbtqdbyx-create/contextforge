# Agent Surface Inventory

`contextforge surface-inventory` writes a repo-specific list of the
agent-readable files ContextForge can see. Use it beside `surface-map`: the map
answers what ContextForge supports, while the inventory answers what this
repository actually exposes to Codex, Claude Code, Copilot, MCP clients,
Cursor, Cline, Gemini CLI, Windsurf, and other adjacent agents.

```bash
contextforge surface-inventory --output contextforge-agent-surface-inventory.md
contextforge surface-inventory --json
```

The inventory includes:

- repo entrypoints such as `README.md`
- `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`
- GitHub Copilot instructions, prompts, custom agents, hooks, and workspace settings
- MCP config files
- Cursor, Cline, and Windsurf rules

Benchmark fixtures and test directories are skipped so the artifact represents
the real repository surface, not ContextForge's own scanner examples.

Use the Markdown artifact in README updates, PR reviews, and CI artifacts when
reviewers ask which files an agent may load before editing. Use the JSON output
when another bot or coding agent needs to route files to `security-audit`,
`mcp-audit`, or `pack`.
