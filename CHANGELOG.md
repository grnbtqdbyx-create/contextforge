# Changelog

## 0.4.0 - Unreleased

- Add explainable context pack file scoring.
- Include per-file "Why included" reasons in generated context packs.
- Surface path matches, task-term matches, instruction files, manifests, and README orientation files as scoring reasons.

## 0.3.0 - Unreleased

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
