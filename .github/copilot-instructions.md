# ContextForge Copilot Instructions

Keep this file short, concrete, and repository-specific. ContextForge audits
this file as agent-readable context.

## Project Map

- CLI entrypoint: `src/cli.ts`.
- Context discovery: `src/utils/contextFiles.ts`.
- Agent context scaffolds: `src/init/agentContext.ts`.
- Context health and security analyzers: `src/analyzers/contextHealth.ts` and
  `src/analyzers/contextSecurity.ts`.
- Public proof docs are generated or refreshed from commands in `README.md`.

## Build and test

```bash
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js audit --min-context-score 70 --min-cache-score 70 --min-security-score 70 --output /tmp/contextforge-audit.json --report /tmp/contextforge-report.html
```

## Working Rules

- Use tests first for behavior changes.
- Keep generated docs and checked-in proof artifacts aligned with CLI output.
- Do not add broad motivational rules, secrets, credentials, or stale project history.
