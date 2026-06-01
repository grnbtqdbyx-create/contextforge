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
contextforge trace-audit --codex --claude --summary contextforge-trace-audit.md
contextforge cost-estimate --codex --claude --summary contextforge-cost-estimate.md --input-price-per-mtok 2 --cached-input-price-per-mtok 0.2 --output-price-per-mtok 10
contextforge doctor --json
```

Success signal:

- Expensive record kinds and projects are visible.
- Volatile prefixes, timestamps, and large tool outputs are identified before
  the next long agent session.
- Repeated tool calls, tool-output-heavy traces, and cache reuse are visible in
  `contextforge-trace-audit.md`.
- Configurable spend estimates are visible in `contextforge-cost-estimate.md`
  without baking provider prices into the repository.

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

## 6. Prepare a Codex or Claude PR Review

Use this when a PR was written by an agent, changes repo instructions, touches
GitHub workflows, or needs a compact review prompt before merge.

```bash
contextforge review-kit --base main --output contextforge-review-kit.md
```

Success signal:

- Reviewers see the changed files and the risk areas ContextForge inferred.
- Codex or Claude gets a copyable prompt that asks for findings first and points
  at `contextforge-pr-comment.md`, `contextforge-agent-plan.md`, and
  `contextforge-proof-pack.md`.
- Maintainers can run the same evidence commands locally or in CI before
  trusting the review.

## 7. Produce Public Proof for Maintainers

Use this when a repository needs visible build-in-public proof that the tool is
real, deterministic, and useful before npm publishing or broad launch.

```bash
contextforge examples --output examples/demo-output.md
contextforge review-kit --demo --base main --output examples/review-kit.md
contextforge doctor --summary contextforge-doctor.md
contextforge artifact-map --output docs/artifacts.md
contextforge scorecard --output contextforge-scorecard.md
contextforge mcp-audit --summary contextforge-mcp-audit.md --sarif contextforge-mcp.sarif
contextforge claude-audit --summary contextforge-claude-audit.md --sarif contextforge-claude.sarif
contextforge trace-audit --demo --summary contextforge-trace-audit.md
contextforge cost-estimate --demo --summary contextforge-cost-estimate.md --input-price-per-mtok 2 --cached-input-price-per-mtok 0.2 --output-price-per-mtok 10
contextforge adoption-brief --output docs/adoption.md
contextforge publish-readiness --summary contextforge-publish-readiness.md
contextforge proof-pack --output contextforge-proof-pack.md
contextforge launch-kit --output docs/launch-post.md
contextforge compare --output docs/comparison.md
contextforge audit --demo --comment examples/pr-comment.md
```

Success signal:

- Visitors can inspect generated token usage, CI audit, and PR comment previews
  without installing anything.
- Visitors can open `contextforge-scorecard.md` first for a one-screen
  Codex/Claude readiness answer.
- Visitors can open `contextforge-mcp-audit.md` to see whether committed MCP
  configs expose secrets, unsafe shell installers, unpinned packages,
  auto-approval, broad tool permissions, or symlinked config files.
- Security reviewers can upload `contextforge-mcp.sarif` so MCP config exposure
  findings appear in GitHub Code Scanning beside other file-backed alerts.
- Claude Code reviewers can open `contextforge-claude-audit.md` or upload
  `contextforge-claude.sarif` to catch risky shared project settings before
  users trust repo-provided permissions and hooks.
- Agent operators can open `contextforge-trace-audit.md` to see whether the demo
  trace wasted turns on repeated tools or bulky output before they try local
  Codex/Claude history.
- Budget reviewers can open `contextforge-cost-estimate.md` to see how price
  assumptions affect observed demo token spend.
- First-time maintainers can open `docs/adoption.md` for the 30-second proof
  path, adjacent-tool positioning, pre-npm try-it commands, and star-worthy
  proof checklist before reading the full repository.
- Reviewers can jump from the generated PR comment to `contextforge-proof-pack.md`
  for the deeper doctor/audit proof packet.
- Visitors and reviewers can open `docs/artifacts.md` to choose the right proof
  artifact before reading the whole repository.
- CI readers can download `contextforge-artifact-map.md` from the audit artifact
  set instead of guessing which uploaded file to inspect first.
- Release maintainers can attach `contextforge-publish-readiness.md` to the
  first npm publish issue and see which package provenance, workflow, and
  account-level setup steps are ready or still human-owned.
- Maintainers have a generated launch post, suggested GitHub topics, and proof
  commands that stay aligned with the CLI.
- Maintainers can attach one proof pack to README updates, launch posts, and
  Codex/Claude handoff issues.
- Visitors can understand how ContextForge complements Repomix, ccusage,
  promptfoo, security scanners, and agent memory conventions.
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
