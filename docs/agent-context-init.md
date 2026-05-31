# Minimal Agent Context Init

ContextForge can bootstrap short, measurable context files for Codex, Claude
Code, and other coding agents:

```bash
contextforge init --agents-md --claude-md --project-name "My Repo"
```

This writes:

- `AGENTS.md` for Codex and tools that follow the AGENTS.md convention
- `CLAUDE.md` for Claude Code project memory

Both templates are intentionally small. Current agent-context research and
vendor guidance point in the same direction: context files work best when they
are specific, operational, and maintained. Broad rules and stale project lore
increase token cost and can make agents explore too widely.

## Overwrite Safety

Existing files are preserved by default:

```bash
contextforge init --agents-md
contextforge init --agents-md --force
```

Use `--force` only after reviewing the current file.

## Recommended Follow-up

After scaffolding, edit the placeholders, then run:

```bash
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md
```

Keep only guidance that helps an agent complete real repository tasks:

- project entry points
- exact build, test, lint, and verification commands
- repo-specific invariants
- narrow safety or release constraints

Avoid:

- motivational text
- generic coding advice
- stale architectural history
- secrets, credentials, or local-only paths
