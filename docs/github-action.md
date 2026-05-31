# GitHub Action Mode

ContextForge can dogfood itself in CI by generating a JSON audit, an HTML
report, a SARIF file for GitHub Code Scanning, a Markdown job summary, a
PR-ready Markdown comment, machine-readable improvement suggestions, a compact
SVG status badge, and an agent-readable action plan on every push or pull
request.

## One-command Setup

Run this from a repository that should audit its agent context in CI:

```bash
contextforge init --all --project-name "My Repo"
contextforge init --github-action
contextforge init --pr-comment-workflow
```

`--all` is the recommended setup for new repositories. It writes the audit
workflow, the optional PR comment workflow, `AGENTS.md`, and `CLAUDE.md`.
The audit workflow writes JSON, HTML, SARIF, Markdown summary, PR comment,
suggestions JSON, SVG badge, and agent action plan artifacts. It refuses to
overwrite existing files by default:

```bash
contextforge init --github-action --force
contextforge init --github-action --action-ref grnbtqdbyx-create/contextforge@v0.32.0
```

`contextforge init --pr-comment-workflow` writes a separate
`.github/workflows/contextforge-pr-comment.yml` workflow that downloads the
`contextforge-pr-comment.md` artifact from the audit run and posts it as a
sticky PR comment. It is opt-in because it requires `pull-requests: write`.

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
      - uses: grnbtqdbyx-create/contextforge@v0.32.0
        with:
          min-context-score: 60
          min-cache-score: 60
          min-security-score: 60
          output: contextforge-audit.json
          report: contextforge-report.html
          sarif: contextforge.sarif
          summary: contextforge-summary.md
          plan: contextforge-agent-plan.md
          comment: contextforge-pr-comment.md
          suggestions: contextforge-suggestions.json
          badge: contextforge-badge.svg
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
            contextforge-summary.md
            contextforge-agent-plan.md
            contextforge-pr-comment.md
            contextforge-suggestions.json
            contextforge-badge.svg
      - uses: github/codeql-action/upload-sarif@v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge.sarif
```

The action builds ContextForge from the action checkout, then runs the built CLI
against the caller repository workspace. It also appends the generated Markdown
summary to `$GITHUB_STEP_SUMMARY` when the workflow runner provides it. The
`contextforge-pr-comment.md` artifact is deterministic and safe to publish with
a separate sticky-comment workflow if the repository grants pull-request write
permissions.

## Sticky PR Comment Workflow

The optional PR comment workflow keeps write permissions separate from the
audit job:

```yaml
name: ContextForge PR Comment

on:
  workflow_run:
    workflows: ["ContextForge Audit"]
    types: [completed]

permissions:
  actions: read
  contents: read
  pull-requests: write

jobs:
  contextforge-pr-comment:
    if: ${{ github.event.workflow_run.event == 'pull_request' && github.event.workflow_run.conclusion != 'skipped' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v6
        with:
          name: contextforge-audit
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ github.token }}
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: contextforge
          path: contextforge-pr-comment.md
```

This posts only the deterministic ContextForge artifact. It does not run a
model, scan local developer history, or expose secrets from the audit job. The
generated workflow passes the pull request number from `workflow_run` explicitly
and only runs when the completed audit run is tied to a pull request.

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
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          package-manager-cache: false
      - run: corepack enable
      - run: corepack prepare pnpm@11.2.2 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: node dist/cli.js audit --min-context-score 60 --min-cache-score 60 --min-security-score 60 --output contextforge-audit.json --report contextforge-report.html --sarif contextforge.sarif --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg
      - name: Write job summary
        if: always()
        run: cat contextforge-summary.md >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: contextforge-audit
          path: |
            contextforge-audit.json
            contextforge-report.html
            contextforge.sarif
            contextforge-summary.md
            contextforge-agent-plan.md
            contextforge-pr-comment.md
            contextforge-suggestions.json
            contextforge-badge.svg
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
Cache/session findings remain in the JSON, HTML, Markdown, and suggestions
artifacts because they are not always tied to a repository file location.

The upload step is guarded so forked pull requests still get JSON/HTML/SARIF
artifacts without requiring `security-events: write` from an untrusted fork.
