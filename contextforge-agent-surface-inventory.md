# ContextForge Agent Surface Inventory

Detected **4** agent-readable repo surfaces.

## Ecosystem Summary

| Ecosystem | Detected | Example files |
| --- | ---: | --- |
| Claude Code | 1 | `CLAUDE.md` |
| GitHub Copilot | 1 | `.github/copilot-instructions.md` |
| OpenAI Codex | 1 | `AGENTS.md` |
| Repository entrypoints | 1 | `README.md` |

## Detected Surfaces

| File | Ecosystem | Coverage | Why it matters |
| --- | --- | --- | --- |
| `.github/copilot-instructions.md` | GitHub Copilot | `contextforge security-audit`, `contextforge agents-md-audit`, `contextforge pack` | Copilot custom instructions, prompts, custom agents, hooks, and workspace settings affect review and coding behavior. |
| `AGENTS.md` | OpenAI Codex | `contextforge agents-md-audit`, `contextforge security-audit`, `contextforge pack` | Codex-compatible repo instructions steer long-running coding tasks. |
| `CLAUDE.md` | Claude Code | `contextforge claude-audit`, `contextforge security-audit`, `contextforge pack` | Claude project memory, settings, skills, subagents, and commands can change tool behavior and permissions. |
| `README.md` | Repository entrypoints | `contextforge security-audit`, `contextforge pack` | README files are commonly read by agents and can become instruction-injection surfaces. |

## Suggested Proof Commands

```bash
contextforge security-audit --min-security-score 80
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge pack --task "review agent context" --budget 20000 --output contextforge-pack.md
```

