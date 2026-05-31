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
| `session-failure` | a recent Codex or Claude session mentioned the file near a failure, error, exception, or regression |
| `session-read` | a recent session read or opened the file through a tool |
| `session-edit` | a recent session edited, patched, wrote, modified, or touched the file |

Example:

```markdown
## src/auth.ts

Why included: task term match: auth (+4); path match: auth (+3)
```

With session evidence enabled:

```bash
contextforge pack --demo --task "investigate login regression" --budget 600
```

```markdown
Why included: task term match: login (+4); session failure mention: 1 (+6); recent session read: 1 (+4); recent session edit: 1 (+5)
```

This is intentionally deterministic and local-first. Future versions can add
static import graph signals. CLI packs stay repo-first by default; pass
`--sessions`, `--codex`, `--claude`, or `--demo` to add recent session-derived
evidence.
