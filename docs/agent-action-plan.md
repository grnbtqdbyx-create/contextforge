# Agent Action Plan

`contextforge plan` turns audit results into a Markdown handoff that Codex,
Claude, or a maintainer can execute without rereading every report artifact.

```bash
contextforge plan --output contextforge-agent-plan.md
```

The plan includes:

- score summary for context health, cache stability, and context security
- prioritized findings with file locations where available
- concrete fix suggestions from the audit rules
- suggested verification commands
- a copyable handoff prompt for Codex or Claude

## CI Artifact

Use `audit --plan` when you want the same handoff generated with the JSON, HTML,
SARIF, and Markdown summary outputs:

```bash
contextforge audit \
  --min-context-score 70 \
  --min-cache-score 70 \
  --min-security-score 70 \
  --output contextforge-audit.json \
  --report contextforge-report.html \
  --sarif contextforge.sarif \
  --summary contextforge-summary.md \
  --plan contextforge-agent-plan.md
```

The reusable GitHub Action and `contextforge init --github-action` generated
workflow upload `contextforge-agent-plan.md` as part of the audit artifact.

## Why It Exists

JSON and SARIF are good for machines. HTML and job summaries are good for
humans. The action plan is the bridge between them: short enough for a coding
agent to read first, but specific enough to preserve priority, suggested
commands, and safety checks.
