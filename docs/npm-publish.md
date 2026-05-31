# npm Publish

ContextForge is prepared for npm publishing, but the workflow is intentionally
manual and dry-run by default.

Recommended setup:

1. Create the `contextforge` package on npm under Ogün Keskin's account.
2. In npm package settings, configure Trusted Publishing for this GitHub repo:
   `grnbtqdbyx-create/contextforge`.
3. Use GitHub-hosted runners only.
4. Add a GitHub environment named `npm-publish` and require maintainer approval
   for the publish job.
5. Run the `npm Publish` workflow with `dry_run=true` first. This runs only the
   preflight checks.
6. Re-run with `dry_run=false` only when the version, changelog, tests, audit,
   and package contents are correct.

The workflow uses npm Trusted Publishing / OIDC instead of a long-lived
`NPM_TOKEN`. npm automatically generates provenance for public packages
published from public GitHub repositories through trusted publishing.

Local preflight:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js security-benchmark
node dist/cli.js audit --min-context-score 70 --min-cache-score 70 --min-security-score 70
npm pack --dry-run
```

The current package name is not published at the time this workflow was added.
Verify before first publish:

```bash
npm view contextforge name version
```

If npm returns `E404`, the package name appears available. If it returns an
existing package, do not publish until the package name and ownership are
resolved.
