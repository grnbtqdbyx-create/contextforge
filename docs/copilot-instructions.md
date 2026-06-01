# GitHub Copilot Instructions

ContextForge treats GitHub Copilot custom instructions as agent-readable repo
context, the same way it treats `AGENTS.md`, `CLAUDE.md`, Cursor rules, and
other instruction files.

Covered files:

- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`

Why this matters:

- Copilot can automatically add repository-wide and path-specific custom
  instructions to requests.
- Copilot CLI can also combine `AGENTS.md` with
  `.github/copilot-instructions.md`.
- Noisy, conflicting, oversized, or malicious Copilot instructions can waste
  context or weaken agent behavior before the model sees the task.

Bootstrap concise Copilot instructions:

```bash
contextforge init --copilot-instructions --project-name "My Repo"
```

Audit them:

```bash
contextforge agents-md-audit
contextforge security-audit --min-security-score 80
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md
```

Use `--all` for a new repository:

```bash
contextforge init --all --project-name "My Repo"
```

That creates the GitHub Actions audit workflow, optional PR comment workflow,
`AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`.
