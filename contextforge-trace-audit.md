# ContextForge Trace Efficiency Audit

Status: **warn**

Score: **85/100**

| Metric | Value |
| --- | --- |
| Records | 10 |
| Tool records | 4 |
| Total tokens | 14482 |
| Tool output tokens | 4760 |
| Cache hit ratio | 37.3% |
| Repeated tool calls | 1 |

| Type | Severity | Source | Message | Suggestion |
| --- | --- | --- | --- | --- |
| redundant-tool-call | medium | fixtures/codex/session.jsonl | codex exec_command repeated 2 times with the same observed input. | Reuse the prior result or narrow the second command instead of repeating identical tool calls. |

## Next Actions

- Remove repeated tool calls or cache their result in the handoff before rerunning.

