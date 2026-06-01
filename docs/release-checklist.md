# v0.1.0 Release Checklist

## Code

- [x] CLI builds with TypeScript.
- [x] Demo mode works without local Codex or Claude Code history.
- [x] Tests cover scanners, usage, audits, pack generation, and secret redaction.
- [x] HTML report generation works.
- [x] Context security findings appear in JSON and HTML audit output.
- [x] Public security benchmark fixtures run from the CLI.
- [x] Context packs can use session-derived failure/read/edit signals.
- [x] Modern Codex rollout JSONL fixture coverage.
- [x] Local session scans are bounded by count and file size.
- [x] Manual npm publish workflow draft.
- [x] npm publish-readiness report separates repo checks from account-level setup.
- [x] Agent readiness scorecard gives README visitors a one-screen Codex/Claude proof surface.
- [x] MCP exposure audit catches committed MCP config secrets, unsafe shell installers, unpinned package launches, auto-approval, broad tool permissions, and symlinked config files.
- [x] MCP exposure findings can be exported as SARIF for GitHub Code Scanning.
- [x] Claude Code project settings can be audited as Markdown and SARIF artifacts.
- [x] Trace efficiency audit catches repeated tool calls, bulky outputs, tool-output-heavy traces, and low cache reuse.
- [x] Cost estimate report uses caller-provided pricing instead of hardcoded provider prices.
- [x] Context pack generation shows a budget ledger and measures final output against the requested token budget.
- [x] GitHub Copilot instruction files are discovered, audited, and scaffolded with the same context hygiene loop as AGENTS.md and CLAUDE.md.
- [x] GitHub Copilot prompt files, custom agents, and project skills are discovered and audited when present.
- [x] GitHub Copilot hook configs are scanned for unsafe shell commands and context-security risk when present.
- [x] VS Code Copilot workspace settings are scanned for risky committed instruction text when present.
- [x] Claude Code project subagents and custom slash commands are discovered, security-audited, and scored as instruction context when present.
- [x] First-time evaluator adoption brief gives visitors a 30-second proof path, adjacent-tool positioning, and pre-npm try-it commands.
- [ ] First approved npm publish.

## GitHub

- [x] Public repository.
- [x] Apache-2.0 license.
- [x] NOTICE and trademark policy.
- [x] DCO contribution guide.
- [x] CI workflow.
- [x] Milestones and first issues.
- [ ] Create GitHub release `v0.1.0`.

## Launch

- [x] Build-in-public launch post draft.
- [x] Demo terminal SVG.
- [x] Generated HTML report screenshot.
- [ ] Record short GIF or terminal session.
- [ ] Share first public post.
