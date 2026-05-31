# Changelog

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
