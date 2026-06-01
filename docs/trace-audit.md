# Trace Efficiency Audit

`contextforge trace-audit` scans Codex and Claude session records for execution
patterns that waste context before the next agent turn.

```bash
contextforge trace-audit
contextforge trace-audit --json
contextforge trace-audit --demo --summary contextforge-trace-audit.md
contextforge trace-audit --codex --summary contextforge-trace-audit.md
contextforge trace-audit --claude --summary contextforge-trace-audit.md
```

The audit flags:

- repeated tool calls with the same tool name and observed input
- bulky tool outputs that can crowd the next turn
- traces where tool output dominates observed token use
- low cache reuse when enough input tokens are present to make cache stability
  meaningful

Use the Markdown summary in build-in-public updates, handoffs between Codex and
Claude, or post-run retrospectives when a session felt expensive but the raw log
is too large to inspect manually. Use `--json` when another tool should consume
the score and findings.

This is intentionally an efficiency report, not a replacement for correctness
tests or security review. Pair it with `contextforge audit`,
`contextforge mcp-audit`, and `contextforge claude-audit` when you need both
repo readiness and execution trace evidence.
