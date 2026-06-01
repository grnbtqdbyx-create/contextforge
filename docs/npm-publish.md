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
published from public GitHub repositories through trusted publishing. The
workflow also packs the npm tarball before publish, generates a GitHub artifact
attestation for `contextforge-*.tgz`, uploads `npm-pack.json`, and publishes
that same tarball during the approved publish job.
The package metadata also points npm readers back to the public repository:
`repository.url` is `git+https://github.com/grnbtqdbyx-create/contextforge.git`,
`homepage` is the GitHub README, and `bugs.url` is the GitHub issue tracker.

The publish workflow opts JavaScript actions into Node 24 with
`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` while GitHub migrates runners away
from Node 20 actions.

Local preflight:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js security-benchmark
node dist/cli.js audit --min-context-score 70 --min-cache-score 70 --min-security-score 70
node dist/cli.js publish-readiness --summary contextforge-publish-readiness.md
npm pack --dry-run
npm pack --json > npm-pack.json
```

`contextforge publish-readiness` separates what the repository can verify from
what must be completed in npm and GitHub settings. It checks package metadata,
package provenance links, the Trusted Publishing workflow, publish preflight
commands, GitHub artifact attestation setup for the npm tarball, and docs. A
`warn` status is expected until Ogün Keskin creates or verifies the npm package,
configures Trusted Publishing for this repository, and approves the
`npm-publish` environment for a real publish run.

The current package name is not published at the time this workflow was added.
Verify before first publish:

```bash
npm view contextforge name version
```

If npm returns `E404`, the package name appears available. If it returns an
existing package, do not publish until the package name and ownership are
resolved.
