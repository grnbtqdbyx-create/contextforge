# Context Security Audit

ContextForge scans repository entrypoint and instruction files as a security
surface, including nested monorepo instruction files that agents may load for
specific subprojects.

Covered files:

- root `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/prompts/**/*.prompt.md`
- `.github/agents/**/*.md`
- `.github/agents/**/*.agent.md`
- `.github/skills/<skill-name>/SKILL.md`
- `.claude/skills/<skill-name>/SKILL.md`
- `.agents/skills/<skill-name>/SKILL.md`
- `.github/hooks/*.json`
- `.github/copilot/settings.json`
- `.github/copilot/settings.local.json`
- `.cursorrules`
- `.clinerules`
- `SKILL.md`

Nested files are reported with repository-relative paths such as
`packages/api/AGENTS.md`. During repo-root scans, ContextForge skips repository
fixture and test directories so benchmark fixtures do not become active
production findings. You can still audit a fixture directory directly by passing
that directory as the audit root.

Current checks:

| Finding | What it catches |
| --- | --- |
| `prompt-injection` | instruction overrides such as "ignore previous instructions" or system prompt leaks |
| `data-exfiltration` | requests to upload, send, post, or leak secrets, tokens, `.env`, SSH keys, or credentials |
| `unsafe-shell` | dangerous shell patterns such as `curl ... | bash`, `wget ... | sh`, or destructive `rm -rf` |
| `hidden-directive` | instructions to hide behavior from the user or act secretly |
| `permission-escalation` | attempts to disable safety, approval, sandbox, or guardrail controls |

Run the focused scanner:

```bash
contextforge security-audit --min-security-score 80
```

Run the public benchmark fixtures:

```bash
contextforge security-benchmark
```

Run the full CI audit:

```bash
contextforge audit \
  --min-context-score 70 \
  --min-cache-score 70 \
  --min-security-score 80 \
  --output contextforge-audit.json \
  --report contextforge-report.html
```

The scanner is deterministic and local-first. It does not make network calls and
does not send repository content to an external model.

## Threat Model

Coding agents read repository files as context. A malicious pull request can add
or modify Markdown instructions in `README.md`, `AGENTS.md`, `CLAUDE.md`,
`.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`,
`.github/prompts/**/*.prompt.md`, `.github/agents/**/*.md`, project
`SKILL.md` files, `.github/hooks/*.json`, `.github/copilot/settings.json`, or
other agent-facing files that look like ordinary project guidance or workflow
automation but try to:

- override higher-priority instructions
- weaken approval and sandbox behavior
- exfiltrate credentials through comments, artifacts, or network calls
- hide malicious behavior from the user
- trick an agent into executing unreviewed shell commands
- install lifecycle hooks that run unsafe shell commands before normal review

ContextForge is not a complete security product, but it gives maintainers an
early CI signal before an agent treats suspicious repo context as trusted input.
