# Proof Pack

`contextforge proof-pack` writes a single Markdown artifact that combines the
first-run doctor report, CI audit scores, rerun commands, and Codex/Claude
handoff guidance.

```bash
contextforge proof-pack --output contextforge-proof-pack.md
contextforge proof-pack --demo --output contextforge-proof-pack.md
```

Use it when a repository needs a shareable proof packet for:

- launch posts and README updates
- maintainer handoff between Codex and Claude sessions
- pull request descriptions
- OpenAI/Codex OSS support evidence
- contributor onboarding issues

The command is deterministic and local-first. It does not call an LLM. The
generated file is meant to be committed only when a project wants a public proof
artifact; otherwise keep it as a local or CI artifact.

The reusable GitHub Action and `contextforge init --github-action` workflow
publish `contextforge-proof-pack.md` as part of the `contextforge-audit`
artifact set. That makes the same proof packet available from every push or
pull request without requiring local session history.

The proof pack includes:

- doctor status and every doctor check
- audit status, context health, cache stability, context security, and cache hit ratio
- top next actions from doctor and audit evidence
- commands to rerun doctor, audit, security benchmark, and context pack creation
- a short Codex/Claude handoff paragraph for the next agent session
