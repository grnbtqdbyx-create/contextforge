# ContextForge Use Cases

ContextForge is most useful when a repository already uses Codex, Claude Code,
or another coding agent for review, debugging, release preparation, or
maintenance. These scenarios show what to run, what artifact to inspect, and
what success looks like.

## 1. Add an Agent Context Gate to a Repository

Use this when a project is starting to accept agent-written PRs or when a
maintainer wants every PR to prove that repo context is concise, safe, and
actionable.

```bash
contextforge init --all --project-name "My Repo"
```

What it creates:

- `.github/workflows/contextforge-audit.yml`
- `.github/workflows/contextforge-pr-comment.yml`
- `AGENTS.md`
- `CLAUDE.md`

Success signal:

- Pull requests upload `contextforge-audit.json`, `contextforge-report.html`,
  `contextforge.sarif`, `contextforge-summary.md`, `contextforge-agent-plan.md`,
  and `contextforge-pr-comment.md`.
- The PR comment summarizes context health, cache stability, context security,
  failing gates, and top agent fixes.

## 2. Clean Up Noisy AGENTS.md or CLAUDE.md Files

Use this when project memory has grown by copying generic prompts, repeated
instructions, or stale process notes.

```bash
contextforge agents-md-audit
contextforge improve --json
contextforge improve --write
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg
```

Success signal:

- Repeated, vague, or oversized instructions become concrete repo rules.
- Codex, Claude, or a bot can parse structured `title`, `text`, and `source`
  fields instead of scraping Markdown bullets.
- CI uploads the same structured suggestions as `contextforge-suggestions.json`.
- Maintainers get a compact `contextforge-badge.svg` proof artifact for status
  dashboards or README workflows.
- `contextforge-agent-plan.md` tells Codex or Claude what to fix first.

## 3. Defend Against Malicious Repo Instructions

Use this before asking an agent to trust a new repository, dependency example,
benchmark fixture, or external contribution.

```bash
contextforge security-audit --min-security-score 80
contextforge security-benchmark
```

Success signal:

- Prompt injection, secret exfiltration, unsafe shell instructions, hidden
  directives, and permission escalation are flagged before the agent follows
  them.
- SARIF output can surface file-backed findings in GitHub Code Scanning.

## 4. Triage Token and Prompt-Cache Waste

Use this when Codex or Claude feels expensive, slow, or repetitive, but a plain
usage dashboard does not explain why.

```bash
contextforge usage --codex --claude
contextforge cache-audit --codex --claude
contextforge doctor --json
```

Success signal:

- Expensive record kinds and projects are visible.
- Volatile prefixes, timestamps, and large tool outputs are identified before
  the next long agent session.

## 5. Build a Task-Specific Context Pack

Use this before handing a focused bug, security review, or refactor to an agent.

```bash
contextforge pack --task "review auth regression" --budget 20000 --sessions
```

Success signal:

- The generated pack stays inside the token budget.
- Each included file explains why it was selected, including task terms,
  manifests, README orientation, instruction files, recent reads, recent edits,
  or failure mentions.

## 6. Produce Public Proof for Maintainers

Use this when a repository needs visible build-in-public proof that the tool is
real, deterministic, and useful before npm publishing or broad launch.

```bash
contextforge examples --output examples/demo-output.md
contextforge doctor --summary contextforge-doctor.md
contextforge launch-kit --output docs/launch-post.md
contextforge audit --demo --comment examples/pr-comment.md
```

Success signal:

- Visitors can inspect generated token usage, CI audit, and PR comment previews
  without installing anything.
- Maintainers have a generated launch post, suggested GitHub topics, and proof
  commands that stay aligned with the CLI.
- Coding agents can start from `llms.txt` and `llms-full.txt` instead of
  guessing the documentation path.

## What ContextForge Is Not

- It is not a generic cost dashboard.
- It is not a replacement for Repomix, ccusage, promptfoo, or security scanners.
- It does not call an LLM to create audit results.
- It does not scan local Codex or Claude history in CI unless explicitly
  requested with session flags.

ContextForge owns the maintainer layer between those tools: repository context
quality, deterministic CI artifacts, and agent-readable next actions.
