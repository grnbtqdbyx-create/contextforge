<!-- contextforge-pr-comment -->
## ContextForge Agent Context Gate

Status: **pass**

| Signal | Score |
| --- | ---: |
| Context health | 76/100 |
| Cache stability | 75/100 |
| Context security | 100/100 |
| Cache hit ratio | 37.3% |

### Failing Gates

- None

### Top Agent Fixes

- **medium repetition** in `AGENTS.md`: Remove repeated phrasing from AGENTS.md so agents see each rule once.
- **medium vague** in `AGENTS.md`: Replace vague guidance in AGENTS.md with concrete repository-specific rules.
- **high volatile-prefix**: Move timestamps and changing request metadata after stable cached context blocks.

### Changed Agent Surfaces

- 1 changed surface across Repository entrypoints.
- **modified** `README.md` (Repository entrypoints)

### Artifacts

- `contextforge-audit.json` for machine-readable gates
- `contextforge-report.html` for the full report
- `contextforge-agent-plan.md` for Codex/Claude handoff
- `contextforge-proof-pack.md` for shareable doctor/audit proof
- `contextforge-review-kit.md` for Codex/Claude review focus
- `contextforge-agent-surface-diff.md` for changed agent-readable surfaces

_Generated deterministically by ContextForge. No model or secret-bearing agent is needed to produce this comment._
