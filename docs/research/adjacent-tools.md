# Adjacent Tool Research

This note tracks the projects ContextForge should learn from and differentiate
against. The goal is not to clone them; it is to make ContextForge useful in the
specific gap between token analytics, repo instruction hygiene, CI audits, and
task-specific context packs for Codex and Claude Code users.

| Project | Signal | What it does well | ContextForge positioning |
| --- | ---: | --- | --- |
| [Repomix](https://github.com/yamadashy/repomix) | 25k+ stars | Packs repositories into AI-friendly files. | Add audit, scoring, cache hygiene, and task-specific budget gates instead of only packing. |
| [ccusage](https://github.com/ryoppippi/ccusage) | 15k+ stars | Analyzes coding-agent token usage and costs from local data. | Pair usage analytics with actionable repo instruction and cache improvements. |
| [AGENTS.md](https://github.com/openai/agents.md) | 21k+ stars | Provides a standard place for coding-agent instructions. | Measure whether those instructions are concise, concrete, and CI-safe. |
| [context-mode](https://github.com/mksglu/context-mode) | 16k+ stars | Runtime context optimization and tool-output sandboxing across agent platforms. | Stay local-first and CI-first, focused on audits, reports, and repo hygiene. |
| [Claude Context](https://github.com/zilliztech/code-context) | 11k+ stars | MCP-based semantic code search for Claude Code and other agents. | Complement retrieval with measurable context health and token/caching reports. |
| [LLMLingua](https://github.com/microsoft/LLMLingua) | 6k+ stars | Prompt and KV-cache compression research. | Use compression as an optional future backend, but keep the MVP deterministic and auditable. |
| [claude-crusts](https://github.com/Abinesh-L/claude-crusts) | early niche | Finds wasted Claude Code context and gives fix commands. | Support both Codex and Claude Code, plus GitHub Action audit artifacts. |
| [prompt-caching](https://github.com/flightlesstux/prompt-caching) | early niche | Optimizes repeated Claude Code reads via prompt caching. | Detect cache instability and surface it as a reportable score in CI. |
| [Snyk agent-scan](https://github.com/snyk/agent-scan) | security-focused | Scans agent components for prompt injections, toxic flows, and risky data handling. | Bring a lighter, repo-instruction-focused subset into ContextForge audits. |
| [Cisco skill-scanner](https://github.com/cisco-ai-defense/skill-scanner) | security-focused | Detects prompt injection, data exfiltration, and malicious code patterns in agent skills. | Apply similar checks to `AGENTS.md`, `CLAUDE.md`, and coding-agent context files. |

## Product Gap

Current projects cluster around three shapes:

- usage dashboards
- context packers
- runtime wrappers or MCP plugins

ContextForge should own a fourth shape:

> CI-ready context quality audits for coding-agent repositories.

That means every repository can ask:

- Are our `AGENTS.md` / `CLAUDE.md` files helping or wasting context?
- Are we breaking prompt-cache stability with volatile prefixes?
- Which session/tool records burn the most tokens?
- Can a maintainer upload an HTML audit artifact on every PR?
- Can the project improve agent rules through measured feedback rather than prompt folklore?
- Are repo context files trying to override instructions, exfiltrate secrets, or weaken tool approvals?

## Next Differentiators

1. GitHub Action mode with JSON and HTML artifacts.
2. Real local Codex and Claude Code parser coverage from synthetic fixtures.
3. Repo instruction security checks for prompt/context poisoning.
4. Task-specific context pack scoring that explains why each file was included.
5. A public benchmark fixture set that compares before/after context health.
