# ContextForge

**Self-learning token and context optimizer for Codex and Claude Code.**

[![CI](https://github.com/grnbtqdbyx-create/contextforge/actions/workflows/ci.yml/badge.svg)](https://github.com/grnbtqdbyx-create/contextforge/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Built in public](https://img.shields.io/badge/built%20in-public-0e8a16.svg)](docs/build-in-public.md)
[![DCO](https://img.shields.io/badge/DCO-required-7057ff.svg)](CONTRIBUTING.md)

AI coding agents burn tokens by re-reading noisy context, huge tool outputs,
unstable cache prefixes, and bloated `AGENTS.md` / `CLAUDE.md` files.
ContextForge shows where those tokens go, reduces context bloat, audits cache
stability, and creates task-specific context packs.

> Built in public by Ogün Keskin. Early APIs may change.

![ContextForge terminal demo](assets/demo-terminal.svg)

## Quickstart

```bash
pnpm install
pnpm build
pnpm contextforge scan --demo
pnpm contextforge usage --demo
pnpm contextforge report --demo
```

Example output:

```text
ContextForge scan complete: 7 records
Providers: claude, codex

Total tokens: 11482
Input: 8112  Output: 3370  Cached: 3328
```

## Why ContextForge?

- **See token waste:** identify expensive sessions, tool outputs, and context files.
- **Improve cache stability:** catch volatile prefixes, timestamps, and large tool dumps.
- **Audit repo instructions:** keep `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and `.clinerules` useful instead of bloated.
- **Generate context packs:** give Codex or Claude only the files needed for a task.
- **Evolve safely:** suggest improved repo-level rules before writing anything.

If this saves you tokens or helps your agent work better, please star the repo.

## Before / After

| Before ContextForge | After ContextForge |
| --- | --- |
| Agents reread noisy logs and broad repo instructions. | Agents get a task-specific context pack. |
| Token spend is visible only after the session is over. | Token waste is summarized by provider, project, and record kind. |
| Cache misses are hard to diagnose. | Volatile prefixes and large tool outputs are flagged. |
| `AGENTS.md` / `CLAUDE.md` grows by guesswork. | Repo instructions get measurable health checks and suggestions. |

## Commands

```bash
contextforge scan [--demo] [--codex] [--claude]
contextforge usage [--demo] [--codex] [--claude]
contextforge cache-audit [--demo]
contextforge agents-md-audit [--demo]
contextforge pack --task "fix auth bug" --budget 20000 [--demo]
contextforge improve [--demo] [--write] [--open-pr]
contextforge report [--demo] [--output contextforge-report.html]
```

## Current Status

ContextForge v0.1.0 is an MVP CLI with:

- Claude Code and Codex JSONL fixture scanners
- local session scanning fallbacks
- token usage summaries
- context health audit
- cache stability audit
- task-specific Markdown context packs
- HTML report generation
- DCO-based contribution flow

## Roadmap

- **v0.1.0:** CLI MVP, demo mode, scanners, audits, report.
- **v0.2.0:** richer Codex/Claude log adapters, npm publish, screenshots/GIF.
- **v0.3.0:** GitHub Action, benchmark mode, PR-based rule improvements.
- **v0.4.0:** optional hosted dashboard and team workflows.

Release preparation lives in [docs/release-checklist.md](docs/release-checklist.md).

## Built for Open Source Maintainers

ContextForge is designed for maintainers using coding agents to triage issues,
review PRs, prepare releases, and preserve code quality without wasting context.
See [docs/codex-for-oss.md](docs/codex-for-oss.md).

## Contributing

Contributions are welcome. Start with issues labeled `good first issue`.
All commits should use DCO sign-off:

```bash
git commit -s -m "Add scanner fixture"
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and Trademarks

Code is licensed under Apache-2.0.

Copyright (c) 2026 Ogün Keskin.

The ContextForge name, logo, domain names, and related branding are trademarks
of Ogün Keskin. See [TRADEMARKS.md](TRADEMARKS.md).
