# ContextForge Agent Surface Diff

Compared against **main** and detected **1** changed agent-readable surface.

## Affected Ecosystems

- Repository entrypoints

## Changed Agent Surfaces

| File | Action | Ecosystem | Follow-up checks | Why it matters |
| --- | --- | --- | --- | --- |
| `README.md` | modified | Repository entrypoints | `contextforge security-audit`, `contextforge pack` | README files are commonly read by agents and can become instruction-injection surfaces. |

## Suggested Proof Commands

```bash
contextforge surface-diff --base main --output contextforge-agent-surface-diff.md
contextforge security-audit --min-security-score 80
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
```

