# Architecture

ContextForge is split into small modules:

- `scanners`: normalize bounded, recent Codex and Claude Code session files.
- `analyzers`: summarize usage, context health, and cache stability.
- `pack`: create task-specific context packs under a token budget.
- `improve`: turn audit findings into repo-rule suggestions.
- `report`: write local HTML reports.
- `doctor`: compose first-run readiness checks across audits, benchmark fixtures, and GitHub workflow presence.
- `security`: ignore risky paths and redact common secrets.

The CLI composes these modules without network calls by default.
Local session scans read recent JSONL files sequentially and skip oversized
files to avoid accidentally loading huge agent histories into memory.
`doctor` is also repo-first by default and only scans local agent sessions when
the user passes `--demo`, `--codex`, or `--claude`. Its `--json` output exposes
the same readiness model without terminal prose for CI and agent workflows.
