# Explainable Context Pack Scoring

ContextForge context packs include a `Why included` line before each file. This
keeps context selection reviewable instead of turning it into another opaque
file dump.

Current scoring reasons:

| Reason | Meaning |
| --- | --- |
| `task-term-match` | a task term appears in the file path or file content |
| `path-match` | a task term appears directly in the relative file path |
| `instruction-file` | file is a repo-level agent instruction file such as `AGENTS.md` or `CLAUDE.md` |
| `manifest` | file is a project manifest or config that helps orient the agent |
| `readme` | file is a README/orientation document |

Example:

```markdown
## src/auth.ts

Why included: task term match: auth (+4); path match: auth (+3)
```

This is intentionally deterministic and local-first. Future versions can add
static import graph signals, recent failure signals, and session-derived
evidence.
