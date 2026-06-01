# Review Kit

`contextforge review-kit` writes a deterministic Markdown brief for Codex,
Claude, human reviewers, or AI review workflows before a pull request is merged.

```bash
contextforge review-kit --base main --output contextforge-review-kit.md
contextforge review-kit --demo --base main --output contextforge-review-kit.md
```

The kit includes:

- the base ref and changed file list
- review focus areas inferred from docs, workflows, source, tests, and
  agent-readable instruction files
- evidence commands for surface diff, doctor, audit, proof pack, tests,
  typecheck, and build
- a copyable Codex/Claude review prompt that asks for findings first

Use it when:

- a PR was written or modified by an AI coding agent
- a maintainer wants Codex or Claude to review the same evidence humans see
- README, `AGENTS.md`, `CLAUDE.md`, workflows, or public proof artifacts changed
- a build-in-public update needs a review artifact that is useful without
  exposing local session history

The command does not call an LLM. In repo mode it compares the current branch
against `--base` with `git diff --name-only` and also includes uncommitted or
untracked working-tree files, so maintainers can run it before opening a PR. In
demo mode it writes stable fixture-style review content for README and launch
previews.

The reusable GitHub Action and `contextforge init --github-action` workflow can
publish `contextforge-review-kit.md` alongside the audit, PR comment, proof
pack, surface diff, suggestions, badge, summary, SARIF, and HTML artifacts. Use checkout
`fetch-depth: 0` when CI should compare the PR branch against the configured
base ref.

When `contextforge audit --comment contextforge-pr-comment.md` is enabled, the
PR-ready comment lists `contextforge-review-kit.md` so reviewers can jump from
the sticky PR discussion to the changed-file review brief, and
`contextforge-agent-surface-diff.md` so reviewers can see changed agent-readable
surfaces before trusting branch context. The comment also embeds a compact
changed-surface summary directly, using the same `--base` ref as the generated
surface-diff artifact.
