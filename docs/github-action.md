# GitHub Action Mode

ContextForge can dogfood itself in CI by generating a JSON audit, an HTML
report, and a SARIF file for GitHub Code Scanning on every push or pull request.

## Reusable Action

The root `action.yml` lets another repository run ContextForge directly from
GitHub, even before the npm package is published:

```yaml
name: ContextForge Audit

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  contextforge-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: grnbtqdbyx-create/contextforge@v0.13.0
        with:
          min-context-score: 60
          min-cache-score: 60
          min-security-score: 60
          output: contextforge-audit.json
          report: contextforge-report.html
          sarif: contextforge.sarif
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge.sarif
```

The action builds ContextForge from the action checkout, then runs the built CLI
against the caller repository workspace.

## Dogfood Workflow

```yaml
name: ContextForge Audit

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

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
      - run: node dist/cli.js audit --min-context-score 60 --min-cache-score 60 --min-security-score 60 --output contextforge-audit.json --report contextforge-report.html --sarif contextforge.sarif
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge.sarif
```

For early projects, start with permissive thresholds and raise them as the repo
instruction files and session hygiene improve.

`contextforge audit` is repo-first by default so CI jobs do not accidentally scan
developer-local session history. Add `--codex` or `--claude` only in environments
where those session files are intentionally available.

The audit also scans repo-level context files for prompt/context poisoning,
including instruction overrides, secret exfiltration requests, unsafe shell
execution, hidden directives, and permission escalation.

The SARIF output currently includes file-backed context health and context
security findings so GitHub can attach alerts to repository instruction files.
Cache/session findings remain in the JSON and HTML reports because they are not
always tied to a repository file location.

The upload step is guarded so forked pull requests still get JSON/HTML/SARIF
artifacts without requiring `security-events: write` from an untrusted fork.
