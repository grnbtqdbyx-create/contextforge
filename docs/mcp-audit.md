# MCP Exposure Audit

`contextforge mcp-audit` scans committed MCP configuration files before Codex,
Claude, Cursor, or another coding agent loads them.

```bash
contextforge mcp-audit
contextforge mcp-audit --json
contextforge mcp-audit --summary contextforge-mcp-audit.md
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge mcp-audit --demo --summary contextforge-mcp-audit.md
```

It looks for repo-local files such as `mcp.json`, `.mcp.json`,
`.cursor/mcp.json`, `.vscode/mcp.json`, `.roo/mcp.json`, and
`.kiro/mcp.json`.

The audit flags:

- hardcoded secrets in MCP server `env` blocks
- `curl` or `wget` installers piped into `bash` or `sh`
- unpinned remote package launches through `npx`, `uvx`, or `pipx`
- automatic MCP tool approval or always-allow settings
- wildcard, write, delete, shell, or execute tool permission grants
- symlinked MCP config files, without following the symlink target
- invalid MCP JSON files that cannot be inspected safely

Use the Markdown summary in README updates, PRs, launch issues, and GitHub
Actions artifacts when contributors need to see whether agent tool configs are
safe to load. Use `--sarif contextforge-mcp.sarif` when the same findings
should appear in GitHub Code Scanning beside repository-instruction SARIF
alerts. Use `--json` when another agent or CI job needs parseable output.

This is intentionally a repo exposure check, not a replacement for reviewing
every MCP server's runtime permissions. Pair it with normal secret scanning,
dependency review, explicit human approval for sensitive tool calls, and
least-privilege credentials.
