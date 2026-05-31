# GitHub Action Mode

ContextForge can dogfood itself in CI by generating a JSON audit and an HTML
report on every push or pull request.

```yaml
name: ContextForge Audit

on:
  pull_request:
  push:
    branches: [main]

jobs:
  contextforge-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with:
          version: 11.2.2
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: node dist/cli.js audit --min-context-score 60 --min-cache-score 60 --output contextforge-audit.json --report contextforge-report.html
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
```

For early projects, start with permissive thresholds and raise them as the repo
instruction files and session hygiene improve.

`contextforge audit` is repo-first by default so CI jobs do not accidentally scan
developer-local session history. Add `--codex` or `--claude` only in environments
where those session files are intentionally available.
