# ContextForge Doctor

`contextforge doctor` is the first command a new maintainer can run to see
whether a repository is ready for agent-assisted work.

```bash
contextforge doctor
contextforge doctor --demo
contextforge doctor --json
contextforge doctor --summary contextforge-doctor.md
```

The report checks:

- context health score
- cache stability score
- context security score
- public security benchmark status
- MCP exposure status for committed MCP server configs
- Claude Code settings status for shared permissions, hooks, HTTP allowlists,
  and sensitive-file deny rules
- agentic workflow status for untrusted GitHub event text reaching model-backed
  jobs
- GitHub Actions hardening status for SHA pins, token permissions,
  `pull_request_target`, pwn-request checkout, and direct script interpolation
- GitHub workflow presence for CI and ContextForge audit artifacts
- public proof surfaces: README, license, contribution guide, changelog,
  demo output, PR comment preview, review-kit preview, and LLM discovery files
- launch profile surfaces: terminal demo asset, report screenshot, artifact
  map, launch kit, and comparison guide
- community health surfaces: Code of Conduct, security policy, issue
  templates, and pull request template
- next actions from repo-rule suggestions

By default, `doctor` is repo-first and does not scan local Codex or Claude Code
session history. Add `--codex`, `--claude`, or `--demo` when session-derived
cache signals are useful.

Use `--json` when another agent, CI job, or dashboard needs to consume the
readiness report without parsing terminal prose. Use `--summary` when humans
need a shareable Markdown checklist for a README update, issue, pull request,
launch post, or weekly build-in-public note.

Use it before opening a PR, preparing a public launch post, or evaluating a new
coding-agent repository.

For public OSS launch work, the `Public proof surfaces` check keeps the repo
page honest: visitors and coding agents should be able to verify what the tool
does, how to contribute, what changed, and where generated examples live without
guessing.

For star/discovery work, the `Launch profile surfaces` check keeps the README
and launch narrative aligned with generated proof: visitors should see the
terminal demo, report screenshot, artifact map, launch kit, and adjacent-tool
comparison before they decide whether the project is worth installing, starring,
or sharing.

For contributor-readiness work, the `Community health surfaces` check keeps the
collaboration path explicit: contributors should know the conduct rules, where
to report security issues, how to open useful issues, and what a pull request
should include before they spend time on the project.

For agent-tooling safety, the `MCP exposure` check keeps committed MCP configs
visible before a coding agent loads them. It flags hardcoded secrets, remote
shell installers, unpinned package launches, auto-approval, broad tool
permissions, and symlinked config files so maintainers can review tool access as
part of the same first-run readiness report.

For Codex/Claude handoffs, the Claude settings, agentic workflow, and GitHub
Actions hardening checks keep the first-run answer honest: a repo can have
great README proof and still be unsafe if shared agent settings weaken
permissions or CI lets untrusted PR text reach privileged model or release
steps.

The Markdown summary keeps the first-run proof portable. It uses the same
doctor result as terminal and JSON output, so maintainers can publish a report
without hand-copying or reinterpreting the readiness checks.
