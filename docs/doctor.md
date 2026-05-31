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
- next actions from repo-rule suggestions

By default, `doctor` is repo-first and does not scan local Codex or Claude Code
session history. Add `--codex`, `--claude`, or `--demo` when session-derived
cache signals are useful.

Use `--json` when another agent, CI job, or dashboard needs to consume the
readiness report without parsing terminal prose.

Use it before opening a PR, preparing a public launch post, or evaluating a new
coding-agent repository.
