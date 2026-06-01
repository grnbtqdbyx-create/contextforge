# ContextForge Artifact Map

Use this to decide which ContextForge artifact a maintainer, reviewer, CI bot, Codex, or Claude should inspect first.

## Artifact Catalog

| Artifact | Audience | Use it when | Produced by |
| --- | --- | --- | --- |
| `contextforge-audit.json` | CI and automation bots | you need machine-readable gates for context, cache, and security readiness | `contextforge audit` |
| `contextforge-report.html` | Maintainers | you want a visual report that can be opened locally or uploaded from CI | `contextforge audit` or `contextforge report` |
| `contextforge.sarif` | GitHub Code Scanning | you want file-backed alerts for risky repository instructions | `contextforge audit --sarif contextforge.sarif` |
| `contextforge-summary.md` | GitHub Actions summary readers | you need a readable readiness summary in a check run or artifact | `contextforge audit --summary contextforge-summary.md` |
| `contextforge-agent-plan.md` | Codex and Claude | you need prioritized fix instructions after a failing or warning audit | `contextforge plan` or `contextforge audit --plan contextforge-agent-plan.md` |
| `contextforge-pr-comment.md` | PR reviewers | you need a sticky PR summary with changed agent-surface drift plus proof and review artifact pointers | `contextforge audit --comment contextforge-pr-comment.md` |
| `contextforge-suggestions.json` | Bots and coding agents | you need structured repository-rule improvement suggestions | `contextforge improve --json` or `contextforge audit --suggestions contextforge-suggestions.json` |
| `contextforge-badge.svg` | README and dashboards | you need a compact readiness badge for a public surface | `contextforge audit --badge contextforge-badge.svg` |
| `contextforge-proof-pack.md` | Launch, review, and handoff readers | you need one shareable proof file that combines doctor and audit evidence | `contextforge proof-pack` |
| `contextforge-scorecard.md` | README visitors, reviewers, and coding agents | you need a one-screen Codex and Claude readiness snapshot | `contextforge scorecard --output contextforge-scorecard.md` |
| `contextforge-agent-surface-map.md` | Agent operators, OSS evaluators, and README visitors | you need to see which Codex, Claude Code, GitHub Copilot, MCP, Cursor, Cline, Gemini CLI, and Windsurf repo surfaces are covered | `contextforge surface-map --output contextforge-agent-surface-map.md` |
| `contextforge-agent-surface-inventory.md` | Agent operators, OSS evaluators, and repo maintainers | you need the actual agent-readable files present in this repository and the command that audits each one | `contextforge surface-inventory --output contextforge-agent-surface-inventory.md` |
| `contextforge-agent-surface-diff.md` | PR reviewers, Codex, Claude, and Copilot agents | you need to know which agent-readable files changed in a branch and which checks should rerun | `contextforge surface-diff --base main --output contextforge-agent-surface-diff.md` |
| `docs/adoption.md` | First-time maintainers and OSS reviewers | you need a decision path for trying, starring, or wiring ContextForge into CI | `contextforge adoption-brief --output docs/adoption.md` |
| `docs/launch-snapshot.md` | README visitors, launch readers, and OSS evaluators | you need a concise research-backed snapshot of why the project matters now, where it fits, and what proof to open first | `contextforge launch-snapshot --output docs/launch-snapshot.md` |
| `contextforge-mcp-audit.md` | Security reviewers and agent operators | you need to review MCP configs for hardcoded secrets, unsafe shell, unpinned packages, auto-approval, broad permissions, or symlinked files | `contextforge mcp-audit --summary contextforge-mcp-audit.md` |
| `contextforge-mcp.sarif` | GitHub Code Scanning | you want MCP config exposure findings to appear beside code scanning alerts | `contextforge mcp-audit --sarif contextforge-mcp.sarif` |
| `contextforge-claude-audit.md` | Claude Code maintainers | you need to review committed Claude Code project settings, hooks, permissions, and sensitive-file denies | `contextforge claude-audit --summary contextforge-claude-audit.md` |
| `contextforge-claude.sarif` | GitHub Code Scanning | you want Claude Code settings findings to appear beside code scanning alerts | `contextforge claude-audit --sarif contextforge-claude.sarif` |
| `contextforge-workflow-audit.md` | Security reviewers and agent workflow maintainers | you need to see whether GitHub issue, PR, review, comment, title, workflow input, or branch/ref text flows into privileged AI workflows | `contextforge workflow-audit --summary contextforge-workflow-audit.md` |
| `contextforge-workflow.sarif` | GitHub Code Scanning | you want agentic workflow injection findings to appear beside code scanning alerts | `contextforge workflow-audit --sarif contextforge-workflow.sarif` |
| `contextforge-trace-audit.md` | Codex and Claude operators | you need to review repeated tool calls, bulky tool output, and cache reuse before another long agent session | `contextforge trace-audit --summary contextforge-trace-audit.md` |
| `contextforge-cost-estimate.md` | Maintainers and budget reviewers | you need a shareable cost estimate from observed session tokens without hardcoded provider pricing | `contextforge cost-estimate --summary contextforge-cost-estimate.md --input-price-per-mtok 2 --cached-input-price-per-mtok 0.2 --output-price-per-mtok 10` |
| `contextforge-pack.md` | Codex, Claude, and human reviewers | you need a task-specific context bundle with a visible token budget ledger | `contextforge pack --task "review auth regression" --budget 20000 --sessions --output contextforge-pack.md` |
| `contextforge-review-kit.md` | PR reviewers, Codex, and Claude | you need changed-file review focus for agent-assisted PRs | `contextforge review-kit --base main --output contextforge-review-kit.md` |
| `contextforge-doctor.md` | First-run and launch readers | you need a first-run checklist for public readiness surfaces | `contextforge doctor --summary contextforge-doctor.md` |
| `docs/artifacts.md` | Visitors, maintainers, and contributors | you need a catalog that explains which generated artifact to inspect first | `contextforge artifact-map --output docs/artifacts.md` |
| `contextforge-artifact-map.md` | CI artifact readers | you need the same catalog attached to a GitHub Actions run | `contextforge artifact-map --output contextforge-artifact-map.md` |
| `contextforge-publish-readiness.md` | Release maintainers | you need npm metadata, provenance links, Trusted Publishing, GitHub tarball attestation, and human approval readiness in one file | `contextforge publish-readiness --summary contextforge-publish-readiness.md` |
| `docs/launch-post.md` | Build-in-public readers | you need launch copy, proof commands, and topic suggestions | `contextforge launch-kit` |
| `docs/comparison.md` | Tool evaluators | you need to position ContextForge beside packers, token dashboards, evals, and scanners | `contextforge compare` |
| `examples/demo-output.md` | First-time visitors | you need deterministic demo output without local Codex or Claude logs | `contextforge examples` |
| `examples/pr-comment.md` | PR reviewers | you need to preview the sticky PR comment format | `contextforge audit --comment examples/pr-comment.md` |
| `examples/review-kit.md` | PR reviewers and agents | you need to preview the review-kit handoff without opening a live PR | `contextforge review-kit --demo --output examples/review-kit.md` |

## Fast Paths

- For a PR reviewer: `contextforge-pr-comment.md` -> `contextforge-review-kit.md` -> `contextforge-agent-surface-diff.md` -> `contextforge-proof-pack.md`.
- For Codex/Claude fixing failures: `contextforge-agent-plan.md` -> `contextforge-summary.md` -> `contextforge-audit.json`.
- For public launch: `contextforge-doctor.md` -> `contextforge-proof-pack.md` -> `docs/launch-post.md`.

## Generate The Full Proof Set

```bash
contextforge artifact-map --output docs/artifacts.md
contextforge artifact-map --output contextforge-artifact-map.md
contextforge publish-readiness --summary contextforge-publish-readiness.md
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg --base main
contextforge proof-pack --output contextforge-proof-pack.md
contextforge launch-snapshot --output docs/launch-snapshot.md
contextforge adoption-brief --output docs/adoption.md
contextforge scorecard --output contextforge-scorecard.md
contextforge surface-map --output contextforge-agent-surface-map.md
contextforge surface-inventory --output contextforge-agent-surface-inventory.md
contextforge surface-diff --base main --output contextforge-agent-surface-diff.md
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge workflow-audit --summary contextforge-workflow-audit.md --sarif contextforge-workflow.sarif
contextforge trace-audit --demo --summary contextforge-trace-audit.md
contextforge cost-estimate --demo --summary contextforge-cost-estimate.md --input-price-per-mtok 2 --cached-input-price-per-mtok 0.2 --output-price-per-mtok 10
contextforge pack --demo --task "review auth regression" --budget 600 --output contextforge-pack.md
contextforge review-kit --base main --output contextforge-review-kit.md
```

