# GitHub Actions Audit

`contextforge actions-audit` scans committed GitHub Actions workflows for
CI/CD hardening issues that matter when coding agents can open PRs, edit
workflows, trigger automation, or prepare releases.

```bash
contextforge actions-audit
contextforge actions-audit --json
contextforge actions-audit --summary contextforge-actions-audit.md
contextforge actions-audit --summary contextforge-actions-audit.md --sarif contextforge-actions.sarif
```

It inspects `.github/workflows/*.yml` and `.github/workflows/*.yaml`.

The audit flags:

- actions that are not pinned to full commit SHAs
- missing top-level workflow `permissions:`
- `permissions: write-all`
- `pull_request_target` workflows
- `pull_request_target` workflows that checkout attacker-controlled PR head code
- untrusted GitHub contexts interpolated directly into `run:` shell steps
- workflows that use JavaScript actions without `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`
  while GitHub Actions transitions hosted runners from Node 20 to Node 24

Use the Markdown summary in PRs, launch issues, README proof surfaces, and
ContextForge Audit artifacts when reviewers need a fast answer to: "Can this
workflow safely run around agent-authored code?" Use
`--sarif contextforge-actions.sarif` when the same findings should appear in
GitHub Code Scanning beside repository-instruction, MCP, Claude settings, and
agentic workflow alerts.

This is intentionally a deterministic hardening check, not a replacement for a
complete CI/CD threat model. It focuses on high-signal GitHub Actions footguns
that are especially risky in agent-heavy repositories: mutable action refs,
overbroad tokens, `pull_request_target`, direct script interpolation, and
privileged release automation.

## Node 24 Runtime Note

GitHub began warning maintainers about JavaScript actions that still declare a
Node 20 runtime before the hosted-runner default moves to Node 24. Set a
workflow-level environment variable to opt in early:

```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```

Some runner versions may still show an annotation that Node 20 actions are
being forced to run on Node 24. In that case the opt-in is working; the warning
is about the action metadata GitHub scanned before applying the runtime
override. ContextForge flags missing opt-ins so repositories can prepare before
the default changes.
