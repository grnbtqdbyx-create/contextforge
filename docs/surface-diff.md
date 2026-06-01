# Agent Surface Diff

`contextforge surface-diff` writes a PR-specific report of changed
agent-readable repository surfaces.

Use it when a branch touches files that can steer coding agents:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/settings*.json`
- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/prompts/**/*.prompt.md`
- `.github/agents/**/*.md`
- `.github/hooks/*.json`
- MCP configs such as `.mcp.json`, `.cursor/mcp.json`, or `.vscode/mcp.json`
- Cursor, Cline, Gemini CLI, and Windsurf rule files
- `README.md`

## Generate

```bash
contextforge surface-diff --base main --output contextforge-agent-surface-diff.md
```

For bots and custom CI checks:

```bash
contextforge surface-diff --base main --json
```

## Why It Helps

Agent-facing repository files are easy to review like ordinary docs, but they
can change tool permissions, instruction priority, review behavior, and the
context loaded by Codex, Claude, Copilot, Cursor, Cline, Gemini, or Windsurf.

The diff artifact gives PR reviewers a short checklist:

- which agent-readable files changed
- which ecosystem is affected
- which ContextForge checks should rerun
- which ordinary changed files were ignored by the surface detector

## CI Pairing

Pair it with the review kit and security audits:

```bash
contextforge review-kit --base main --output contextforge-review-kit.md
contextforge surface-diff --base main --output contextforge-agent-surface-diff.md
contextforge security-audit --min-security-score 80
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
```

The reusable GitHub Action and dogfood workflow publish
`contextforge-agent-surface-diff.md` beside the scorecard, inventory, review
kit, proof pack, and artifact map.
