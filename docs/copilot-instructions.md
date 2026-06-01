# GitHub Copilot Customization

ContextForge treats GitHub Copilot customization files as agent-readable repo
context, the same way it treats `AGENTS.md`, `CLAUDE.md`, Cursor rules, and
other instruction files. That now includes always-on custom instructions,
reusable prompt files, repository custom agents, and project skills.

Covered files:

- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/prompts/**/*.prompt.md`
- `.github/agents/**/*.md`
- `.github/agents/**/*.agent.md`
- `.github/skills/<skill-name>/SKILL.md`
- `.claude/skills/<skill-name>/SKILL.md`
- `.agents/skills/<skill-name>/SKILL.md`

Why this matters:

- Copilot can automatically add repository-wide and path-specific custom
  instructions to requests.
- Prompt files, custom agents, and project skills can carry reusable task
  guidance that affects how Copilot plans or executes work.
- Copilot CLI can also combine `AGENTS.md` with
  `.github/copilot-instructions.md`.
- Noisy, conflicting, oversized, or malicious Copilot customization files can
  waste context or weaken agent behavior before the model sees the task.

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
`AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`. Prompt files,
custom agents, and project skills are audited when present, but ContextForge
does not scaffold them yet because those files should stay task-specific.
