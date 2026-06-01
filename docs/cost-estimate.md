# Cost Estimate

`contextforge cost-estimate` turns parsed Codex and Claude session token records
into a configurable cost report.

ContextForge does not hardcode provider prices because model pricing changes.
Pass the prices you want to evaluate, expressed as USD per 1 million tokens:

```bash
contextforge cost-estimate --demo \
  --input-price-per-mtok 2 \
  --cached-input-price-per-mtok 0.2 \
  --output-price-per-mtok 10 \
  --summary contextforge-cost-estimate.md
```

Useful variants:

```bash
contextforge cost-estimate --json --demo
contextforge cost-estimate --codex --summary contextforge-cost-estimate.md
contextforge cost-estimate --claude --summary contextforge-cost-estimate.md
```

The report separates:

- input tokens
- cached input tokens
- uncached input tokens
- output tokens
- total estimated cost
- provider and project buckets

Use this beside `contextforge usage`, `contextforge cache-audit`, and
`contextforge trace-audit` when a session feels expensive and you need a
shareable estimate without exposing full local session logs.
