# ContextForge Adoption Brief

A fast evaluator page for maintainers deciding whether this repository is worth trying, starring, or wiring into CI.

## Why Now

- Coding agents such as Codex and Claude can open PRs, run tools, and consume large repository context, but their results still depend on the repo surfaces they ingest.
- Token dashboards explain spend after the fact; ContextForge turns noisy instructions, cache instability, and risky repo context into fixable checks before a long agent session.
- Agent evals increasingly need execution-efficiency evidence, not just final pass/fail outcomes; ContextForge can summarize repeated tools, bulky outputs, and cache reuse from local traces.
- MCP adoption adds a new committed tool-config surface. ContextForge makes those configs visible before agents load them.

## Who Should Try It

- Open source maintainers using Codex, Claude Code, Cursor, Copilot agent mode, or MCP-powered coding tools.
- Teams reviewing AI-authored pull requests and wanting deterministic proof artifacts instead of screenshots.
- Developers who already use repo packers, token dashboards, or prompt evals but still need repository readiness gates.

## 30-Second Evaluation Path

```bash
contextforge scorecard --output contextforge-scorecard.md
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge trace-audit --demo --summary contextforge-trace-audit.md
contextforge artifact-map --output docs/artifacts.md
```

- Open `contextforge-scorecard.md` first for the one-screen Codex/Claude readiness snapshot.
- Open `contextforge-mcp-audit.md` when the repo has MCP config files or agent tool setup; upload `contextforge-mcp.sarif` when GitHub Code Scanning should track those findings.
- Open `contextforge-claude-audit.md` when the repo commits Claude Code project settings, hooks, or permissions.
- Open `contextforge-trace-audit.md` when you want to see whether a Codex or Claude trace wasted context on repeated tools or bulky outputs.
- Open `docs/artifacts.md` when CI uploaded many files and you need the right next proof artifact.

## How It Fits

| Adjacent tool | Keep using it for | ContextForge adds |
| --- | --- | --- |
| Repomix / Gitingest | packaging repository files for an LLM | smaller task packs, context health, security gates, and proof artifacts |
| ccusage / token dashboards | broad session cost visibility | repo-level fixes for noisy instructions and cache instability |
| promptfoo / eval suites | prompt and model behavior tests | repository readiness and trace-efficiency evidence before agents ingest docs, rules, PR comments, or MCP configs |
| MCP scanners / gateways | runtime server and tool-surface analysis | committed config checks before an agent trusts the repo |

## Try It Before npm Publish

```bash
git clone https://github.com/grnbtqdbyx-create/contextforge
cd contextforge
pnpm install
pnpm build
node dist/cli.js doctor --summary contextforge-doctor.md
node dist/cli.js scorecard --output contextforge-scorecard.md
node dist/cli.js mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
node dist/cli.js claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
node dist/cli.js trace-audit --demo --summary contextforge-trace-audit.md
```

After npm publish, the same proof path should work with `npx contextforge ...`.

## Star-Worthy Proof

- The CLI is deterministic and local-first; it does not call an LLM to create audit results.
- The repository dogfoods its own GitHub Action and uploads scorecard, MCP audit, MCP SARIF, Claude settings audit, trace audit, proof-pack, review-kit, artifact-map, SARIF, JSON, HTML, and Markdown artifacts.
- Release notes include validation commands and GitHub Actions run evidence.
- The project is Apache-2.0 licensed with DCO contribution flow and trademark policy.

Repo: https://github.com/grnbtqdbyx-create/contextforge

