<!-- contextforge-pr-comment -->
## ContextForge Agent Context Gate

Status: **pass**

| Signal | Score |
| --- | ---: |
| Context health | 76/100 |
| Cache stability | 75/100 |
| Context security | 100/100 |
| Cache hit ratio | 37.7% |

### Failing Gates

- None

### Top Agent Fixes

- **medium repetition** in `AGENTS.md`: Remove repeated phrasing from AGENTS.md so agents see each rule once.
- **medium vague** in `AGENTS.md`: Replace vague guidance in AGENTS.md with concrete repository-specific rules.
- **high volatile-prefix**: Move timestamps and changing request metadata after stable cached context blocks.

### Artifacts

- `contextforge-audit.json` for machine-readable gates
- `contextforge-report.html` for the full report
- `contextforge-agent-plan.md` for Codex/Claude handoff

_Generated deterministically by ContextForge. No model or secret-bearing agent is needed to produce this comment._
