# Security Benchmark

ContextForge ships a small public benchmark for repo-level context poisoning
patterns. It is intentionally simple, deterministic, and local-first so
maintainers can compare changes without sending repository content to an
external model.

Run it:

```bash
contextforge security-benchmark
```

The default fixtures live in `fixtures/security-benchmark`:

| Case | Expected score | Expected findings | Purpose |
| --- | --- | --- | --- |
| `benign-minimal` | `100` | none | Proves clean repo instructions do not produce false positives. |
| `suspicious-hidden-approval` | `70-80` | `hidden-directive`, `permission-escalation` | Catches stealthy approval bypass guidance without full exfiltration. |
| `malicious-exfil-shell` | `0-40` | `prompt-injection`, `data-exfiltration`, `unsafe-shell`, `hidden-directive`, `permission-escalation` | Exercises high-risk context poisoning patterns in one fixture. |
| `malicious-readme-injection` | `0-40` | `prompt-injection`, `data-exfiltration`, `unsafe-shell`, `hidden-directive`, `permission-escalation` | Proves root README instructions are treated as an agent-readable attack surface. |

You can point the runner at another compatible fixture directory:

```bash
contextforge security-benchmark --benchmark-dir ./my-fixtures
```

Each benchmark directory needs a `manifest.json` with cases, expected score
ranges, and expected finding types. This keeps future scanner changes honest:
better rules should improve coverage without silently creating regressions.
