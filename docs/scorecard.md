# Agent Readiness Scorecard

`contextforge scorecard` writes a compact Markdown snapshot for README sections,
PR descriptions, launch posts, and GitHub Actions artifacts.

```bash
contextforge scorecard --output contextforge-scorecard.md
contextforge scorecard --demo --output contextforge-scorecard.md
contextforge scorecard --json
```

The scorecard is intentionally shorter than the proof pack. Use it when a
reader needs a fast answer to one question:

> Is this repository ready for Codex or Claude Code to work efficiently and
> safely?

It combines:

- agent readiness score from context health, cache stability, and context security
- doctor checks for public proof, launch profile, community health, MCP exposure, and workflows
- next best actions
- links to the deeper proof pack, review kit, surface diff, artifact map, and action plan

## CI Artifact

The reusable GitHub Action, generated audit workflow, and ContextForge dogfood
workflow upload `contextforge-scorecard.md` next to the MCP audit, proof pack,
review kit, surface diff, artifact map, SARIF, summary, badge, and JSON report.

Use `contextforge-scorecard.md` as the first artifact to open. If it is clean,
open `contextforge-proof-pack.md` for evidence and `contextforge-review-kit.md`
for changed-file review focus. On PRs, open
`contextforge-agent-surface-diff.md` before approving branch changes that touch
agent-readable instructions, rules, settings, or tool configs.
