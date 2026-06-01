# ContextForge Agent Readiness Scorecard

A one-screen snapshot for maintainers, reviewers, and coding agents deciding whether this repository is ready for Codex or Claude Code.

## At A Glance

| Signal | Status | Detail |
| --- | --- | --- |
| Agent readiness score | 100/100 | overall pass |
| Context health | 100/100 | repo instructions are concise, discoverable, and scoped |
| Cache stability | 100/100 | repo-first run with no local sessions scanned |
| Context security | 100/100 | repo context checked for injection, exfiltration, unsafe shell, and hidden directives |

## Public Surface Checks

| Check | Status | Detail |
| --- | --- | --- |
| Context health | pass | 100/100 across repo context files |
| Cache stability | pass | 100/100 with no local sessions scanned |
| Context security | pass | 100/100 from repo instruction files |
| Security benchmark | pass | 4/4 benchmark cases passing |
| Claude Code settings | pass | 100/100 with no Claude Code settings found |
| Agentic workflows | pass | 100/100 across .github/workflows/ci.yml, .github/workflows/contextforge-audit.yml, .github/workflows/npm-publish.yml |
| GitHub Actions hardening | pass | 100/100 across .github/workflows/ci.yml, .github/workflows/contextforge-audit.yml, .github/workflows/npm-publish.yml |
| GitHub workflows | pass | ci.yml, contextforge-audit.yml present |
| Public proof surfaces | pass | README.md, LICENSE, CONTRIBUTING.md, CHANGELOG.md, llms.txt, llms-full.txt, examples/demo-output.md, examples/pr-comment.md, examples/review-kit.md present |
| Launch profile surfaces | pass | demo-terminal.svg, contextforge-report.png, docs/launch-post.md, docs/comparison.md, docs/artifacts.md present |
| Community health surfaces | pass | CODE_OF_CONDUCT.md, SECURITY.md, bug_report.md, feature_request.md, PULL_REQUEST_TEMPLATE.md present |
| MCP exposure | pass | 100/100 with no repo MCP configs found |

## Why Codex And Claude Should Care

- They can start from a small, current readiness snapshot instead of reading every generated artifact first.
- They can jump to the proof pack for evidence, the review kit for changed-file focus, or the action plan for fixes.
- They can see whether repo instructions, cache behavior, and context security are healthy before spending a long session.

## Next Best Actions

- Keep the scorecard, proof pack, review kit, and artifact map current before the next public launch.

## Evidence Commands

```bash
contextforge scorecard --output contextforge-scorecard.md
contextforge proof-pack --output contextforge-proof-pack.md
contextforge review-kit --base main --output contextforge-review-kit.md
contextforge mcp-audit --summary contextforge-mcp-audit.md
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge workflow-audit --summary contextforge-workflow-audit.md --sarif contextforge-workflow.sarif
contextforge actions-audit --summary contextforge-actions-audit.md --sarif contextforge-actions.sarif
contextforge artifact-map --output contextforge-artifact-map.md
```

