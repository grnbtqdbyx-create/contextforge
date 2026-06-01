# GitHub Action Mode

ContextForge can dogfood itself in CI by generating a JSON audit, an HTML
report, a SARIF file for GitHub Code Scanning, a Markdown job summary, a
PR-ready Markdown comment, machine-readable improvement suggestions, a compact
SVG status badge, a shareable proof pack, a one-screen readiness scorecard, an
agent surface support matrix, a repo-specific agent surface inventory, a
PR-specific agent surface diff, a
committed MCP exposure audit, a dedicated MCP SARIF file, a Codex/Claude review
kit, a Claude Code settings audit, a dedicated Claude settings SARIF file, an
agentic GitHub workflow audit, a dedicated workflow SARIF file, a GitHub
Actions hardening audit, a dedicated Actions SARIF file, and an agent-readable
action plan on every push or pull request.

## One-command Setup

Run this from a repository that should audit its agent context in CI:

```bash
contextforge init --all --project-name "My Repo"
contextforge init --github-action
contextforge init --pr-comment-workflow
```

`--all` is the recommended setup for new repositories. It writes the audit
workflow, the optional PR comment workflow, `AGENTS.md`, `CLAUDE.md`, and
`.github/copilot-instructions.md`.
The audit workflow writes JSON, HTML, SARIF, Markdown summary, PR comment,
suggestions JSON, SVG badge, proof-pack Markdown, scorecard Markdown,
agent surface map Markdown, agent surface inventory Markdown, agent surface diff Markdown,
MCP audit Markdown, MCP SARIF, Claude settings Markdown, Claude settings SARIF,
agentic workflow Markdown, workflow SARIF, GitHub Actions audit Markdown,
Actions SARIF, trace audit Markdown, review-kit Markdown, artifact-map
Markdown, and agent action plan artifacts. It
refuses to overwrite existing files by default:

```bash
contextforge init --github-action --force
contextforge init --github-action --action-ref grnbtqdbyx-create/contextforge@v0.70.0
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

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  contextforge-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5
        with:
          fetch-depth: 0
      - uses: grnbtqdbyx-create/contextforge@v0.70.0
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
          review-base-ref: main
          proof-pack: contextforge-proof-pack.md
          scorecard: contextforge-scorecard.md
          surface-map: contextforge-agent-surface-map.md
          surface-inventory: contextforge-agent-surface-inventory.md
          surface-diff: contextforge-agent-surface-diff.md
          mcp-audit: contextforge-mcp-audit.md
          mcp-sarif: contextforge-mcp.sarif
          claude-audit: contextforge-claude-audit.md
          claude-sarif: contextforge-claude.sarif
          workflow-audit: contextforge-workflow-audit.md
          workflow-sarif: contextforge-workflow.sarif
          actions-audit: contextforge-actions-audit.md
          actions-sarif: contextforge-actions.sarif
          trace-audit: contextforge-trace-audit.md
          review-kit: contextforge-review-kit.md
          artifact-map: contextforge-artifact-map.md
          review-base-ref: main
      - uses: actions/upload-artifact@330a01c490aca151604b8cf639adc76d48f6c5d4 # v5
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
            contextforge-proof-pack.md
            contextforge-scorecard.md
            contextforge-agent-surface-map.md
            contextforge-agent-surface-inventory.md
            contextforge-agent-surface-diff.md
            contextforge-mcp-audit.md
            contextforge-mcp.sarif
            contextforge-claude-audit.md
            contextforge-claude.sarif
            contextforge-workflow-audit.md
            contextforge-workflow.sarif
            contextforge-actions-audit.md
            contextforge-actions.sarif
            contextforge-trace-audit.md
            contextforge-review-kit.md
            contextforge-artifact-map.md
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-mcp.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-claude.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-workflow.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-actions.sarif
```

The action builds ContextForge from the action checkout, then runs the built CLI
against the caller repository workspace. It also appends the generated Markdown
summary to `$GITHUB_STEP_SUMMARY` when the workflow runner provides it. The
`contextforge-proof-pack.md` artifact is generated as the shareable packet for
launch posts, PRs, and Codex/Claude handoffs. The `contextforge-pr-comment.md`
artifact is deterministic, points reviewers at `contextforge-proof-pack.md`
and `contextforge-review-kit.md`, and is safe to publish with a separate
sticky-comment workflow if the repository grants pull-request write
permissions.
The `contextforge-scorecard.md` artifact is the first file to open when a
reader needs a short agent-readiness answer before inspecting the deeper proof
packet.
The `contextforge-agent-surface-map.md` artifact shows which Codex, Claude
Code, GitHub Copilot, MCP, Cursor, Cline, Gemini CLI, and Windsurf repo surfaces are covered
and which ContextForge command proves each surface.
The `contextforge-agent-surface-inventory.md` artifact shows the actual
agent-readable files present in the caller repository and the ContextForge
commands that audit each one.
The `contextforge-agent-surface-diff.md` artifact shows which agent-readable
files changed in the branch, which agent ecosystems are affected, and which
checks should rerun before reviewers trust the new context.
The `contextforge-pr-comment.md` artifact embeds the same changed-surface
summary so reviewers can see agent-context drift without opening the full
artifact first.
The `contextforge-mcp-audit.md` artifact shows whether committed MCP configs
contain hardcoded secrets, unsafe remote shell installers, unpinned package
launches, auto-approval, broad tool permissions, or symlinked config files
before coding agents load those tool definitions.
The `contextforge-mcp.sarif` artifact carries the same MCP exposure findings to
GitHub Code Scanning with `mcp-exposure/*` rule ids.
The `contextforge-claude-audit.md` and `contextforge-claude.sarif` artifacts
show whether committed Claude Code project settings contain risky permission
modes, broad Bash allow rules, remote shell hooks, wildcard HTTP hooks, or
missing sensitive-file deny rules.
The `contextforge-workflow-audit.md` and `contextforge-workflow.sarif`
artifacts show whether GitHub issue, PR, review, comment, title, workflow input,
or branch/ref text flows into agentic jobs with write permissions or secrets.
The `contextforge-actions-audit.md` and `contextforge-actions.sarif` artifacts
show whether GitHub Actions workflows have mutable action refs, missing
permissions, pwn-request checkout, or direct shell interpolation of untrusted
GitHub context.
The `contextforge-trace-audit.md` artifact summarizes repeated tool calls,
bulky tool output, tool-output-heavy traces, and cache reuse from available
Codex or Claude session records.
The `contextforge-review-kit.md` artifact gives Codex, Claude, and human
reviewers the changed files, review focus areas, evidence commands, and a
copyable review prompt. Use `fetch-depth: 0` on checkout when a repository wants
the review kit to compare reliably against `review-base-ref`.
The `contextforge-artifact-map.md` artifact gives CI readers the same catalog as
`docs/artifacts.md`, so artifact-heavy workflows have a deterministic index
attached to each run.

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

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  contextforge-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5
        with:
          node-version: 24
          package-manager-cache: false
      - run: corepack enable
      - run: corepack prepare pnpm@11.2.2 --activate
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: node dist/cli.js audit --min-context-score 60 --min-cache-score 60 --min-security-score 60 --output contextforge-audit.json --report contextforge-report.html --sarif contextforge.sarif --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg --base main
      - run: node dist/cli.js proof-pack --output contextforge-proof-pack.md
        if: always()
      - run: node dist/cli.js scorecard --output contextforge-scorecard.md
        if: always()
      - run: node dist/cli.js surface-map --output contextforge-agent-surface-map.md
        if: always()
      - run: node dist/cli.js surface-inventory --output contextforge-agent-surface-inventory.md
        if: always()
      - run: node dist/cli.js surface-diff --base main --output contextforge-agent-surface-diff.md
        if: always()
      - run: node dist/cli.js mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
        if: always()
      - run: node dist/cli.js claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
        if: always()
      - run: node dist/cli.js workflow-audit --summary contextforge-workflow-audit.md --sarif contextforge-workflow.sarif
        if: always()
      - run: node dist/cli.js actions-audit --summary contextforge-actions-audit.md --sarif contextforge-actions.sarif
        if: always()
      - run: node dist/cli.js trace-audit --summary contextforge-trace-audit.md
        if: always()
      - run: node dist/cli.js review-kit --base main --output contextforge-review-kit.md
        if: always()
      - run: node dist/cli.js artifact-map --output contextforge-artifact-map.md
        if: always()
      - name: Write job summary
        if: always()
        run: cat contextforge-summary.md >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@330a01c490aca151604b8cf639adc76d48f6c5d4 # v5
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
            contextforge-proof-pack.md
            contextforge-scorecard.md
            contextforge-agent-surface-map.md
            contextforge-agent-surface-inventory.md
            contextforge-agent-surface-diff.md
            contextforge-mcp-audit.md
            contextforge-mcp.sarif
            contextforge-claude-audit.md
            contextforge-claude.sarif
            contextforge-workflow-audit.md
            contextforge-workflow.sarif
            contextforge-actions-audit.md
            contextforge-actions.sarif
            contextforge-trace-audit.md
            contextforge-review-kit.md
            contextforge-artifact-map.md
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-mcp.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-claude.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-workflow.sarif
      - uses: github/codeql-action/upload-sarif@7211b7c8077ea37d8641b6271f6a365a22a5fbfa # v4
        if: ${{ always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) }}
        with:
          sarif_file: contextforge-actions.sarif
```

For early projects, start with permissive thresholds and raise them as the repo
instruction files and session hygiene improve.

`contextforge audit` is repo-first by default so CI jobs do not accidentally scan
developer-local session history. Add `--codex` or `--claude` only in environments
where those session files are intentionally available.

The audit also scans repo-level context files for prompt/context poisoning,
including instruction overrides, secret exfiltration requests, unsafe shell
execution, hidden directives, and permission escalation.

The main SARIF output includes file-backed context health and context security
findings so GitHub can attach alerts to repository instruction files. The MCP
SARIF output separately attaches committed agent tool configuration findings to
MCP config files. The Claude settings SARIF output separately attaches shared
permission and hook findings to `.claude/settings.json`. Cache/session findings
remain in the JSON, HTML, Markdown, and suggestions artifacts because they are
not always tied to a repository file location.

The upload step is guarded so forked pull requests still get JSON/HTML/SARIF
artifacts without requiring `security-events: write` from an untrusted fork.
