# Agentic Workflow Audit

`contextforge workflow-audit` scans committed GitHub Actions workflows for
agentic prompt-injection risk before Codex, Claude, Copilot, or another coding
agent receives untrusted GitHub event text.

```bash
contextforge workflow-audit
contextforge workflow-audit --json
contextforge workflow-audit --summary contextforge-workflow-audit.md
contextforge workflow-audit --summary contextforge-workflow-audit.md --sarif contextforge-workflow.sarif
contextforge workflow-audit --demo --summary contextforge-workflow-audit.md
```

It inspects `.github/workflows/*.yml` and `.github/workflows/*.yaml`.

The audit flags workflows that combine agentic commands or actions with:

- issue, pull request, review, comment, discussion, or workflow input text
- `pull_request_target` or write-capable repository permissions
- repository secrets in the same job surface as untrusted event text

Use the Markdown summary in PRs, launch issues, README proof surfaces, and
ContextForge Audit artifacts when reviewers need a fast answer to: "Can a
stranger's GitHub text reach a privileged AI workflow?" Use
`--sarif contextforge-workflow.sarif` when the same findings should appear in
GitHub Code Scanning beside repository-instruction, MCP, and Claude settings
alerts.

This is a deterministic repo-surface check. It does not replace a full Actions
security review, but it makes the highest-risk agentic pattern visible: untrusted
event text flowing into a model-backed command while the job can write to the
repository or read secrets.
