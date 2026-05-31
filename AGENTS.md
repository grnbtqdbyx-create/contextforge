# ContextForge Agent Guide

Run these checks before claiming a change is ready:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `node dist/cli.js audit --demo --min-context-score 70 --min-cache-score 70`

Keep generated artifacts out of commits:

- `dist/`
- `contextforge-report.html`
- `contextforge-audit.json`
- `contextforge-pack.md`
- `contextforge-suggestions.md`

When changing scanners or analyzers, add fixture-backed tests under `tests/`.

Do not add network calls to default CLI paths. ContextForge must stay local-first
unless a command explicitly documents a networked workflow.
