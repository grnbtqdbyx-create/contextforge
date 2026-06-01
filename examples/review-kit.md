# ContextForge Review Kit

## Review Scope

| Field | Value |
| --- | --- |
| Base ref | `main` |
| Changed files | 4 |

## Changed Files

- `.github/workflows/contextforge-audit.yml`
- `README.md`
- `src/report/prComment.ts`
- `tests/prComment.test.ts`

## Review Focus

- Agent-readable instructions and README entrypoints changed; check for noisy context or prompt-injection risk.
- GitHub workflow files changed; verify permissions, artifact paths, and fork-safe behavior.
- Runtime source changed; verify behavior with focused tests and the built CLI.
- Tests changed; verify the new expectations fail before implementation and pass after.
- Documentation changed; verify public claims match generated artifacts and release evidence.

## Evidence Commands

```bash
contextforge review-kit --base main --output contextforge-review-kit.md
contextforge surface-diff --base main --output contextforge-agent-surface-diff.md
contextforge doctor --summary contextforge-doctor.md
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg --base main
contextforge proof-pack --output contextforge-proof-pack.md
pnpm test
pnpm typecheck
pnpm build
```

## Codex / Claude Review Prompt

```text
You are reviewing a ContextForge pull request for correctness, safety, and agent usefulness.
Compare the branch against main.
Read `contextforge-pr-comment.md`, `contextforge-agent-plan.md`, `contextforge-proof-pack.md`, and `contextforge-agent-surface-diff.md` if they exist.
Focus on behavior regressions, security or prompt-injection risk, CI artifact drift, missing tests, and misleading public claims.
Do not approve based only on green tests; verify that tests cover the changed behavior.

Changed files:
- .github/workflows/contextforge-audit.yml
- README.md
- src/report/prComment.ts
- tests/prComment.test.ts

Return findings first, ordered by severity, with file and line references where possible.
```

