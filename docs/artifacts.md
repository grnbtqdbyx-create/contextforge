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
| `contextforge-pr-comment.md` | PR reviewers | you need a sticky PR summary that points at proof and review artifacts | `contextforge audit --comment contextforge-pr-comment.md` |
| `contextforge-suggestions.json` | Bots and coding agents | you need structured repository-rule improvement suggestions | `contextforge improve --json` or `contextforge audit --suggestions contextforge-suggestions.json` |
| `contextforge-badge.svg` | README and dashboards | you need a compact readiness badge for a public surface | `contextforge audit --badge contextforge-badge.svg` |
| `contextforge-proof-pack.md` | Launch, review, and handoff readers | you need one shareable proof file that combines doctor and audit evidence | `contextforge proof-pack` |
| `contextforge-review-kit.md` | PR reviewers, Codex, and Claude | you need changed-file review focus for agent-assisted PRs | `contextforge review-kit --base main --output contextforge-review-kit.md` |
| `contextforge-doctor.md` | First-run and launch readers | you need a first-run checklist for public readiness surfaces | `contextforge doctor --summary contextforge-doctor.md` |
| `docs/artifacts.md` | Visitors, maintainers, and contributors | you need a catalog that explains which generated artifact to inspect first | `contextforge artifact-map --output docs/artifacts.md` |
| `contextforge-artifact-map.md` | CI artifact readers | you need the same catalog attached to a GitHub Actions run | `contextforge artifact-map --output contextforge-artifact-map.md` |
| `contextforge-publish-readiness.md` | Release maintainers | you need npm metadata, provenance links, Trusted Publishing, and human approval readiness in one file | `contextforge publish-readiness --summary contextforge-publish-readiness.md` |
| `docs/launch-post.md` | Build-in-public readers | you need launch copy, proof commands, and topic suggestions | `contextforge launch-kit` |
| `docs/comparison.md` | Tool evaluators | you need to position ContextForge beside packers, token dashboards, evals, and scanners | `contextforge compare` |
| `examples/demo-output.md` | First-time visitors | you need deterministic demo output without local Codex or Claude logs | `contextforge examples` |
| `examples/pr-comment.md` | PR reviewers | you need to preview the sticky PR comment format | `contextforge audit --comment examples/pr-comment.md` |
| `examples/review-kit.md` | PR reviewers and agents | you need to preview the review-kit handoff without opening a live PR | `contextforge review-kit --demo --output examples/review-kit.md` |

## Fast Paths

- For a PR reviewer: `contextforge-pr-comment.md` -> `contextforge-review-kit.md` -> `contextforge-proof-pack.md`.
- For Codex/Claude fixing failures: `contextforge-agent-plan.md` -> `contextforge-summary.md` -> `contextforge-audit.json`.
- For public launch: `contextforge-doctor.md` -> `contextforge-proof-pack.md` -> `docs/launch-post.md`.

## Generate The Full Proof Set

```bash
contextforge artifact-map --output docs/artifacts.md
contextforge artifact-map --output contextforge-artifact-map.md
contextforge publish-readiness --summary contextforge-publish-readiness.md
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg
contextforge proof-pack --output contextforge-proof-pack.md
contextforge review-kit --base main --output contextforge-review-kit.md
```

