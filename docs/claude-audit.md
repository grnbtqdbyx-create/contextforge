# Claude Code Settings Audit

`contextforge claude-audit` scans committed Claude Code project settings before
Claude Code users trust repo-provided permissions, hooks, and helper behavior.

```bash
contextforge claude-audit
contextforge claude-audit --json
contextforge claude-audit --summary contextforge-claude-audit.md
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge claude-audit --demo --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
```

It looks for repo-local files such as `.claude/settings.json` and
`.claude/settings.local.json`.

The audit flags:

- risky `defaultMode` values such as `bypassPermissions` or `dontAsk`
- shared settings that do not disable bypass permissions mode when risky modes
  are present
- broad `permissions.allow` Bash rules such as `Bash(*)`
- hooks that pipe remote `curl` or `wget` output into `bash` or `sh`
- wildcard HTTP hook URL allowlists
- missing `permissions.deny` rules for common sensitive paths such as `.env`
  files and `secrets` directories
- invalid Claude settings JSON files that cannot be inspected safely

Use the Markdown summary in PRs, README updates, launch issues, and GitHub
Actions artifacts when contributors need to see whether Claude Code settings are
safe to load. Use `--sarif contextforge-claude.sarif` when the same findings
should appear in GitHub Code Scanning beside repository-instruction and MCP
exposure alerts. Use `--json` when another agent or CI job needs parseable
output.

This is intentionally a repo exposure check, not a replacement for Claude Code's
runtime permission prompts, sandboxing, trust verification, and command
injection detection. Pair it with normal code review, least-privilege
permissions, and explicit human approval for sensitive tool calls.
