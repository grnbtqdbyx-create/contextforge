# ContextForge Demo Output

This file is generated from deterministic fixture data so visitors can inspect the public output before installing the CLI.

## Token Usage

```bash
contextforge usage --demo
```

```text
Total tokens: 14482
Input: 8932  Output: 5550  Cached: 3328
By kind
  user           2000 tokens (2 records)
  assistant      7390 tokens (4 records)
  tool           5092 tokens (4 records)
```

## CI Audit

```bash
contextforge audit --demo --min-context-score 70 --min-cache-score 70 --min-security-score 70 --summary contextforge-summary.md --plan contextforge-agent-plan.md
```

```text
ContextForge audit: pass
Context health: 76/100  Cache stability: 75/100  Context security: 100/100
Cache hit ratio: 37.3%
```

## Agent Handoff

```bash
contextforge plan --demo --output contextforge-agent-plan.md
```

```text
Read contextforge-agent-plan.md, fix the highest-priority finding first, keep the change scoped, run the suggested verification commands, and update the plan if the audit result changes.
```

## Why This Matters

- Gives Codex and Claude a stable context budget before a coding session starts.
- Turns token usage, prompt-cache stability, and context-file risk into CI gates.
- Produces a compact handoff plan that another agent can follow without rereading the whole repository.
