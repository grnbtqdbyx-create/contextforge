# ContextForge Launch Kit

## One-Liner

ContextForge is a local-first context readiness gate for Codex and Claude Code repositories.

## Proof Commands

```bash
contextforge doctor --summary contextforge-doctor.md
contextforge review-kit --base main --output contextforge-review-kit.md
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg
contextforge pack --task "review auth regression" --budget 20000 --sessions
```

## Suggested GitHub Topics

`codex` `claude-code` `coding-agents` `context-engineering` `token-usage` `prompt-caching` `ai-security` `github-actions`

## Launch Post Draft

I am building ContextForge in public.

AI coding agents are powerful, but repositories still waste their context with noisy instructions, unstable cache prefixes, huge tool outputs, and unsafe Markdown.

ContextForge turns that layer into a deterministic readiness check for Codex and Claude Code: context health, cache stability, prompt-injection safety, review kits, public proof files, community health files, CI artifacts, and task-specific context packs.

Try the proof path:

```bash
contextforge doctor --summary contextforge-doctor.md
```

Repo: https://github.com/grnbtqdbyx-create/contextforge

If this helps your agent work with less waste and better handoffs, a star helps more maintainers find it.

## Maintainer Checklist

- README explains the problem in the first screen.
- `contextforge doctor --summary` produces a shareable readiness report.
- GitHub topics match the target audience.
- Release notes include validation commands.
- Open issues show what contributors can help with next.

