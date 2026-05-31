# ContextForge Doctor

`contextforge doctor` is the first command a new maintainer can run to see
whether a repository is ready for agent-assisted work.

```bash
contextforge doctor
contextforge doctor --demo
contextforge doctor --json
```

The report checks:

- context health score
- cache stability score
- context security score
- public security benchmark status
- GitHub workflow presence for CI and ContextForge audit artifacts
- public proof surfaces: README, license, contribution guide, changelog,
  demo output, PR comment preview, and LLM discovery files
- community health surfaces: Code of Conduct, security policy, issue
  templates, and pull request template
- next actions from repo-rule suggestions

By default, `doctor` is repo-first and does not scan local Codex or Claude Code
session history. Add `--codex`, `--claude`, or `--demo` when session-derived
cache signals are useful.

Use `--json` when another agent, CI job, or dashboard needs to consume the
readiness report without parsing terminal prose.

Use it before opening a PR, preparing a public launch post, or evaluating a new
coding-agent repository.

For public OSS launch work, the `Public proof surfaces` check keeps the repo
page honest: visitors and coding agents should be able to verify what the tool
does, how to contribute, what changed, and where generated examples live without
guessing.

For contributor-readiness work, the `Community health surfaces` check keeps the
collaboration path explicit: contributors should know the conduct rules, where
to report security issues, how to open useful issues, and what a pull request
should include before they spend time on the project.
