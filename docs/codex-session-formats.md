# Codex Session Formats

ContextForge supports both simple Codex JSONL chat records and modern rollout
records with nested payloads.

Covered fixture shapes:

| Row type | Nested signal | Normalized as |
| --- | --- | --- |
| `{ role, content, usage }` | simple chat/log rows | user, assistant, or tool records |
| `session_meta` | `payload.cwd`, `payload.originator`, `payload.cli_version` | system record |
| `turn_context` | `payload.cwd`, model, sandbox, approval, and turn metadata | system record |
| `event_msg` | `payload.type=user_message` | user record |
| `event_msg` | `payload.type=token_count` and `payload.info.total_token_usage` | system record with token totals |
| `response_item` | `payload.type=message` | assistant/user/system record by role |
| `response_item` | `payload.type=function_call` | tool record with `toolName` |
| `response_item` | `payload.type=function_call_output` | tool record |

Local safety defaults:

- scan at most the newest 50 JSONL files per provider
- skip session files larger than 5 MB
- read selected files sequentially instead of loading every session at once

Override the window:

```bash
contextforge scan --codex --max-session-files 100 --max-session-file-mb 10
```

Fixtures are synthetic and secret-free. They are based on observed row shapes,
not copied user transcripts.
