# Changelog

## 0.19.0 - 2026-05-31

- Include root `README.md` in context security scans because agents commonly read repository entrypoints.
- Add a malicious README injection benchmark fixture covering prompt override, secret exfiltration, hidden directives, permission escalation, and unsafe shell execution.
- Update security docs and research notes around README/repository-entrypoint prompt injection risk.

## 0.18.0 - 2026-05-31

- Add `contextforge init --agents-md` to scaffold a concise, auditable `AGENTS.md` for Codex and other coding agents.
- Add `contextforge init --claude-md` to scaffold a concise `CLAUDE.md` project memory for Claude Code.
- Support `--project-name` and `--force` for generated agent context files.
- Update onboarding docs around minimal context files after current OpenAI, Anthropic, and AGENTS.md research signals.

## 0.17.0 - 2026-05-31

- Add `contextforge plan` for agent-readable audit action plans that Codex and Claude can execute from.
- Add `contextforge audit --plan contextforge-agent-plan.md` so CI artifacts include a prioritized fix plan.
- Extend the reusable GitHub Action and generated workflows with `contextforge-agent-plan.md` artifacts.
- Refresh README and adjacent-tool research around the gap between token dashboards, context registries, AGENTS.md research, and actionable repo context gates.

## 0.16.1 - 2026-05-31

- Replace deprecated `pnpm/action-setup` usage with Corepack-based pnpm setup in GitHub workflows.
- Add `packageManager` metadata so pnpm versioning is explicit in local and CI environments.

## 0.16.0 - 2026-05-31

- Add `contextforge init --github-action` to scaffold a ready-to-run ContextForge audit workflow.
- Generate reusable-action CI with JSON, HTML, SARIF, Markdown summary artifacts, and fork-safe SARIF upload.
- Support `--force` overwrite and `--action-ref` pinning for build-in-public adoption before npm publish completes.

## 0.15.0 - 2026-05-31

- Discover nested `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.clinerules`, and `SKILL.md` files in monorepos.
- Report repository-relative nested instruction paths in context health, context security, SARIF, and Markdown outputs.
- Skip repository fixture and test directories during repo-root scans while still allowing fixture directories to be audited directly.

## 0.14.0 - 2026-05-31

- Add `contextforge audit --summary contextforge-summary.md` for human-readable Markdown audit summaries.
- Append Markdown summaries to GitHub Actions job summaries from the reusable action and dogfood workflow.
- Include summary artifacts alongside JSON, HTML, and SARIF outputs.

## 0.13.0 - 2026-05-31

- Add a reusable root GitHub Action so repositories can run ContextForge with `uses: grnbtqdbyx-create/contextforge@v0.13.0`.
- Expose score thresholds and JSON, HTML, and SARIF output paths as action inputs and outputs.
- Document a copy-paste workflow that uploads audit artifacts and optionally uploads SARIF to GitHub Code Scanning.

## 0.12.0 - 2026-05-31

- Add `contextforge audit --sarif contextforge.sarif` for GitHub Code Scanning compatible SARIF 2.1.0 output.
- Convert file-backed context health and context security findings into SARIF rules, results, severity levels, and repository-relative locations.
- Dogfood SARIF upload in the ContextForge Audit workflow with GitHub Code Scanning.

## 0.11.1 - 2026-05-31

- Normalize npm `bin.contextforge` metadata to avoid publish-time package correction warnings.
- Add package metadata coverage for the CLI bin path before the first public npm publish.

## 0.11.0 - 2026-05-31

- Add `contextforge doctor --json` for machine-readable readiness reports that CI jobs and coding agents can consume.
- Refresh README positioning around the first five-minute value, differentiation, and public launch workflow.
- Update adjacent-tool research notes with current signals from context packers, token usage tools, agent security scanners, and orchestration CLIs.

## 0.10.0 - 2026-05-31

- Add `contextforge doctor` as a first-run readiness report for context health, cache stability, context security, benchmark status, and GitHub workflow presence.
- Keep `doctor` repo-first by default so it does not scan local agent sessions unless `--demo`, `--codex`, or `--claude` is passed.
- Add CLI and model coverage for the doctor report.

## 0.9.1 - 2026-05-31

- Fix CLI bounded session scan options so `--max-session-files` and `--max-session-file-mb` are forwarded into Codex and Claude scanners.
- Allow `src/cli.ts` helpers to be imported in tests without executing the CLI entrypoint.
- Add regression coverage for scanner option forwarding.

## 0.9.0 - 2026-05-31

- Add a manual npm publish workflow draft with dry-run default, Trusted Publishing/OIDC permissions, and package checks.
- Add npm publish documentation for first-publish setup, maintainer approval, and local preflight commands.
- Mark the package public via `publishConfig.access`.

## 0.8.0 - 2026-05-31

- Expand Codex session parsing for modern rollout JSONL records such as `session_meta`, `turn_context`, `event_msg`, `response_item`, function calls, function call outputs, and token counts.
- Add synthetic, secret-free Codex rollout fixtures based on observed local schemas.
- Bound local Codex and Claude session scans by recent file count and file size to avoid loading huge agent histories into memory.
- Add `--max-session-files` and `--max-session-file-mb` controls for local scan windows.

## 0.7.0 - 2026-05-31

- Add session-derived context pack scoring for files mentioned in failures, recent reads, and recent edits.
- Surface session scoring reasons in `Why included` so Codex and Claude users can audit why files were selected.
- Keep `pack` repo-first by default while enabling session signals with `--sessions`, `--codex`, `--claude`, or `--demo`.
- Refresh demo session fixtures so generated packs show failure/read/edit signals.
- Exclude generated ContextForge artifacts from future packs and avoid false secret redaction for ordinary `sk-` word fragments.

## 0.6.0 - 2026-05-31

- Add public malicious-context benchmark fixtures for benign, suspicious, and malicious repo instructions.
- Add `contextforge security-benchmark` to compare scanner output against expected findings and score ranges.
- Include docs and fixtures in the npm package so demo and benchmark commands work after install.

## 0.5.0 - 2026-05-31

- Add a real generated HTML report screenshot to the README.
- Include README visual assets in the npm package so package pages can render the demo and report preview.

## 0.4.0 - 2026-05-31

- Add explainable context pack file scoring.
- Include per-file "Why included" reasons in generated context packs.
- Surface path matches, task-term matches, instruction files, manifests, and README orientation files as scoring reasons.

## 0.3.0 - 2026-05-31

- Add context-file security audit for prompt injection, secret exfiltration, unsafe shell instructions, hidden directives, and permission escalation.
- Add `contextforge security-audit` for focused repo instruction security checks.
- Include context security score and findings in JSON and HTML audit output.
- Add malicious context fixtures and fixture-backed tests.

## 0.2.0 - 2026-05-31

- Add `contextforge audit` for CI-ready JSON and HTML audit output.
- Add ContextForge dogfood GitHub Actions workflow.
- Add adjacent-tools research and positioning notes.
- Add release-safe defaults for audit output and generated artifacts.

## 0.1.0 - 2026-05-31

- Bootstrap ContextForge TypeScript CLI.
- Add demo scanners for Codex and Claude Code JSONL sessions.
- Add token usage, context health, and cache stability audits.
- Add task-specific context pack generation.
- Add HTML report generation.
- Add Apache-2.0 license, DCO contribution flow, and trademark notice.
