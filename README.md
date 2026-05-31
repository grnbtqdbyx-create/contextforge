# ContextForge

**Self-learning token and context optimizer for Codex and Claude Code.**

[![CI](https://github.com/grnbtqdbyx-create/contextforge/actions/workflows/ci.yml/badge.svg)](https://github.com/grnbtqdbyx-create/contextforge/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Built in public](https://img.shields.io/badge/built%20in-public-0e8a16.svg)](docs/build-in-public.md)
[![DCO](https://img.shields.io/badge/DCO-required-7057ff.svg)](CONTRIBUTING.md)
[![npm publish ready](https://img.shields.io/badge/npm-publish%20ready-cb3837.svg)](docs/npm-publish.md)

AI coding agents burn tokens by re-reading noisy context, huge tool outputs,
unstable cache prefixes, and bloated `AGENTS.md` / `CLAUDE.md` files.
ContextForge shows where those tokens go, reduces context bloat, audits cache
stability, scans repo instructions for prompt/context poisoning, and creates
task-specific context packs.

> Built in public by Ogün Keskin. Early APIs may change.

![ContextForge terminal demo](assets/demo-terminal.svg)

## Report Preview

Generated from the built CLI with `contextforge report --demo`:

![ContextForge HTML report screenshot](assets/contextforge-report.png)

## Quickstart

```bash
pnpm install
pnpm build
pnpm contextforge doctor --demo
pnpm contextforge scan --demo
pnpm contextforge usage --demo
pnpm contextforge report --demo
```

Example output:

```text
ContextForge scan complete: 9 records
Providers: claude, codex

Total tokens: 12582
Input: 8832  Output: 3750  Cached: 3328
```

## Why ContextForge?

- **See token waste:** identify expensive sessions, tool outputs, and context files.
- **Improve cache stability:** catch volatile prefixes, timestamps, and large tool dumps.
- **Audit repo instructions:** keep `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and `.clinerules` useful instead of bloated.
- **Catch context poisoning:** flag instruction overrides, secret exfiltration, unsafe shell, hidden directives, and permission escalation.
- **Generate explainable context packs:** give Codex or Claude only the files needed for a task, with "why included" reasons.
- **Evolve safely:** suggest improved repo-level rules before writing anything.

If this saves you tokens or helps your agent work better, please star the repo.

## Before / After

| Before ContextForge | After ContextForge |
| --- | --- |
| Agents reread noisy logs and broad repo instructions. | Agents get a task-specific context pack. |
| Token spend is visible only after the session is over. | Token waste is summarized by provider, project, and record kind. |
| Cache misses are hard to diagnose. | Volatile prefixes and large tool outputs are flagged. |
| `AGENTS.md` / `CLAUDE.md` grows by guesswork. | Repo instructions get measurable health checks and suggestions. |
| Malicious repo instructions hide in plain Markdown. | Context security findings fail CI before an agent trusts them. |
| Context packs are opaque file dumps. | Each selected file includes score reasons such as task term, path, manifest, or instruction file. |

## Commands

```bash
contextforge scan [--demo] [--codex] [--claude]
contextforge usage [--demo] [--codex] [--claude]
contextforge cache-audit [--demo]
contextforge security-audit [--demo] [--min-security-score 60]
contextforge security-benchmark [--benchmark-dir fixtures/security-benchmark]
contextforge agents-md-audit [--demo]
contextforge pack --task "fix auth bug" --budget 20000 [--demo] [--sessions] [--codex] [--claude]
contextforge improve [--demo] [--write] [--open-pr]
contextforge report [--demo] [--output contextforge-report.html]
contextforge audit [--demo] [--output contextforge-audit.json] [--report contextforge-report.html] [--min-security-score 60]
contextforge doctor [--demo] [--benchmark-dir fixtures/security-benchmark]
```

Local session scans are bounded by default. Use `--max-session-files` and
`--max-session-file-mb` when you need a wider or narrower Codex/Claude history
window.

## CI / Dogfood Mode

Use `contextforge audit` in CI to produce a JSON gate and an HTML artifact:

```bash
contextforge audit --min-context-score 60 --min-cache-score 60 --min-security-score 60 \
  --output contextforge-audit.json \
  --report contextforge-report.html
```

See [docs/github-action.md](docs/github-action.md) for a complete GitHub Actions
workflow. ContextForge also runs this audit against itself.

By default, `audit` is repo-first and does not scan local session history. Add
`--codex`, `--claude`, or `--demo` when you want session usage included.

Security audit details live in [docs/security-audit.md](docs/security-audit.md).
Public malicious-context benchmark details live in
[docs/security-benchmark.md](docs/security-benchmark.md).
Codex JSONL parser coverage is documented in
[docs/codex-session-formats.md](docs/codex-session-formats.md).
npm publish preparation is documented in [docs/npm-publish.md](docs/npm-publish.md).
First-run readiness checks are documented in [docs/doctor.md](docs/doctor.md).

## Research-backed Positioning

ContextForge learns from popular tools like Repomix, ccusage, AGENTS.md,
context-mode, Claude Context, and LLMLingua, but focuses on a narrower gap:
**CI-ready context quality audits for coding-agent repositories.**

See [docs/research/adjacent-tools.md](docs/research/adjacent-tools.md).

## Current Status

ContextForge v0.10.0 is a public MVP CLI with:

- Claude Code and Codex JSONL fixture scanners
- bounded local session scanning fallbacks
- first-run `contextforge doctor` readiness report
- token usage summaries
- context health audit
- context security audit
- public malicious-context benchmark fixtures
- cache stability audit
- task-specific Markdown context packs with session-derived scoring
- HTML report generation
- real README report screenshot generated from the CLI
- DCO-based contribution flow
- CI-ready `contextforge audit` dogfood workflow
- manual npm publish workflow draft with OIDC/trusted-publishing preparation

## Roadmap

- **v0.1.0:** CLI MVP, demo mode, scanners, audits, report.
- **v0.2.0:** CI-ready audit command, GitHub Actions dogfood, adjacent-tool positioning.
- **v0.3.0:** context-file security audit for malicious repo instructions.
- **v0.4.0:** explainable context pack scoring with per-file inclusion reasons.
- **v0.5.0:** real generated HTML report screenshot and packaged README assets.
- **v0.6.0:** public malicious-context benchmark fixtures and `security-benchmark` command.
- **v0.7.0:** session-derived context pack scoring from failure/read/edit signals.
- **v0.8.0:** broader modern Codex rollout JSONL parsing and bounded local scans.
- **v0.9.0:** manual npm publish workflow draft with dry-run default and OIDC preparation.
- **v0.9.1:** bounded session scan CLI option forwarding fix.
- **v0.10.0:** first-run `doctor` command for repo readiness and launch-friendly onboarding.
- **Next:** first approved npm publish and public launch post.

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
