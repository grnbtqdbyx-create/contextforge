# Launch Post Draft

I am building ContextForge in public.

ContextForge is a local-first token and context optimizer for Codex and Claude
Code. It helps developers see where agent tokens go, reduce context bloat, audit
prompt-cache stability, and generate task-specific context packs.

Why this matters:

- AI coding agents often reread noisy repo context.
- Large tool outputs quietly consume useful context window.
- Bloated `AGENTS.md` and `CLAUDE.md` files can cost tokens without improving task success.
- Prompt caching works best when stable context stays stable.

Try the demo:

```bash
pnpm install
pnpm contextforge scan --demo
pnpm contextforge usage --demo
pnpm contextforge report --demo
```

Repo: https://github.com/grnbtqdbyx-create/contextforge

If this saves you tokens or helps your coding agent work better, a star would
help the project reach more maintainers.

