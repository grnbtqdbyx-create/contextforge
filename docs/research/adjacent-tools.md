# Adjacent Tool Research

This note tracks the projects ContextForge should learn from and differentiate
against. The goal is not to clone them; it is to make ContextForge useful in the
specific gap between token analytics, repo instruction hygiene, CI audits, and
task-specific context packs for Codex and Claude Code users.

| Project | Signal | What it does well | ContextForge positioning |
| --- | ---: | --- | --- |
| [Repomix](https://github.com/yamadashy/repomix) | 25k+ stars | Packs repositories into AI-friendly files. | Add audit, scoring, cache hygiene, and task-specific budget gates instead of only packing. |
| [ccusage](https://github.com/ryoppippi/ccusage) | 15k+ stars | Analyzes coding-agent token usage and costs from local data. | Pair usage analytics with actionable repo instruction and cache improvements. |
| [AGENTS.md](https://github.com/openai/agents.md) | 21k+ stars | Provides a standard place for coding-agent instructions. | Measure whether those instructions are concise, concrete, and CI-safe. |
| [context-mode](https://github.com/mksglu/context-mode) | 16k+ stars | Runtime context optimization and tool-output sandboxing across agent platforms. | Stay local-first and CI-first, focused on audits, reports, and repo hygiene. |
| [Claude Context](https://github.com/zilliztech/code-context) | 11k+ stars | MCP-based semantic code search for Claude Code and other agents. | Complement retrieval with measurable context health and token/caching reports. |
| [LLMLingua](https://github.com/microsoft/LLMLingua) | 6k+ stars | Prompt and KV-cache compression research. | Use compression as an optional future backend, but keep the MVP deterministic and auditable. |
| [claude-crusts](https://github.com/Abinesh-L/claude-crusts) | early niche | Finds wasted Claude Code context and gives fix commands. | Support both Codex and Claude Code, plus GitHub Action audit artifacts. |
| [prompt-caching](https://github.com/flightlesstux/prompt-caching) | early niche | Optimizes repeated Claude Code reads via prompt caching. | Detect cache instability and surface it as a reportable score in CI. |
| [Snyk agent-scan](https://github.com/snyk/agent-scan) | security-focused | Scans agent components for prompt injections, toxic flows, and risky data handling. | Bring a lighter, repo-instruction-focused subset into ContextForge audits. |
| [Cisco skill-scanner](https://github.com/cisco-ai-defense/skill-scanner) | security-focused | Detects prompt injection, data exfiltration, and malicious code patterns in agent skills. | Apply similar checks to `AGENTS.md`, `CLAUDE.md`, and coding-agent context files. |

## 2026 Onboarding and Output Snapshot

May 31, 2026 research shows that tools in this space earn trust quickly when
they expose a low-friction first command plus machine-readable output:

| Project | Current signal | What it suggests for ContextForge |
| --- | --- | --- |
| [mco](https://github.com/mco-org/mco) | Multi-agent orchestration CLI with `doctor` and JSON-oriented workflows. | Keep `contextforge doctor` as the fastest first-run proof and add JSON for agent/CI consumption. |
| [promptfoo-action](https://github.com/promptfoo/promptfoo-action) | GitHub Action focused on prompt/agent/RAG tests with PR integration. | Make ContextForge outputs easy to wire into PR checks, comments, and artifacts. |
| [agent-security-scanner-mcp](https://github.com/sinewaveai/agent-security-scanner-mcp) | Security scanner docs emphasize fail-closed CI behavior, SARIF, and agent prompt/action scans. | ContextForge should keep deterministic local checks and eventually expose SARIF or PR annotations. |
| [ccusage](https://github.com/ryoppippi/ccusage) | Unified local usage reports now span many coding-agent CLIs, including Codex and Claude Code. | Avoid competing as a generic cost dashboard; connect usage signals to repo hygiene and context-pack actions. |
| [Repomix](https://github.com/yamadashy/repomix) | Mature repository packing category with strong adoption. | ContextForge should explain why it is not just another packer: scoring, security, cache, CI, and next actions. |

ContextForge v0.12.0 follows the SARIF direction by turning file-backed context
health and context security findings into GitHub Code Scanning alerts while
keeping broader token/cache/session evidence in JSON and HTML reports.
ContextForge v0.13.0 adds a root composite GitHub Action so repositories can
adopt that workflow before npm publishing is complete.
ContextForge v0.14.0 adds Markdown summaries for GitHub Actions job summaries
so maintainers can inspect the result without downloading artifacts.
ContextForge v0.15.0 follows the nested-instruction direction by recursively
auditing monorepo-local `AGENTS.md`, `CLAUDE.md`, and skill files instead of
assuming that only root-level context exists.
ContextForge v0.16.0 turns that adoption path into a one-command scaffold with
`contextforge init --github-action`, so maintainers can add the reusable action
without hand-copying YAML.
ContextForge v0.17.0 adds an agent-readable action plan so CI does not only
say pass/fail; it produces a prioritized fix handoff for Codex or Claude.
ContextForge v0.18.0 adds minimal `AGENTS.md` and `CLAUDE.md` scaffolding so
new repositories start with short, auditable context instead of copied prompt
sprawl.
ContextForge v0.19.0 expands security scanning to root `README.md`, matching
current incident reports and benchmarks where agents follow malicious
instructions embedded in repository entrypoints.
ContextForge v0.20.0 adds deterministic public demo output so new visitors can
inspect token usage, CI audit, and handoff artifacts in the first 30 seconds.
ContextForge v0.21.0 adds a PR-ready Markdown comment artifact so maintainers
can bring the same evidence into review surfaces without running a model.
ContextForge v0.22.0 follows the sticky-comment adoption pattern by scaffolding
that posting workflow separately from the read-only audit job.
It also adds `contextforge init --all` to match the successful one-command
quickstart pattern used by mature CLI tools.
ContextForge v0.23.0 adds root `llms.txt` and `llms-full.txt` files as an
AI-readable project map for coding agents, while documenting that `llms.txt` is
an emerging convention rather than a guaranteed discovery or ranking signal.
ContextForge v0.24.0 adds use-case-first onboarding so maintainers can map
common agent-context problems to exact commands, artifacts, and success signals.
ContextForge v0.25.0 follows the structured-output pattern used by agent-friendly
CLIs by adding `contextforge improve --json`, so repo-rule suggestions can move
from human-readable bullets into Codex, Claude, CI bots, or PR automation.
ContextForge v0.26.0 promotes those suggestions into a CI artifact with
`contextforge audit --suggestions contextforge-suggestions.json`, matching the
artifact-first workflow used by Actions-native maintainer tools.
ContextForge v0.27.0 adds `contextforge audit --badge contextforge-badge.svg`
so repositories can surface agent-context readiness as a compact visible proof
artifact alongside JSON, HTML, SARIF, Markdown, and PR-comment outputs.
ContextForge v0.28.0 adds `Public proof surfaces` to `contextforge doctor`,
because public OSS trust depends on README, license, contribution, changelog,
demo, and LLM-discovery files being present before maintainers ask for adoption.
ContextForge v0.29.0 adds `Community health surfaces` to `contextforge doctor`,
because contributor trust also depends on Code of Conduct, security policy,
issue templates, and pull request template files being visible from day one.
ContextForge v0.30.0 adds `contextforge doctor --summary`, because current
context-engineering and token-dashboard tools compete on fast visible proof;
ContextForge should let maintainers publish first-run readiness evidence as
Markdown, not only terminal text or JSON.
ContextForge v0.31.0 adds `contextforge launch-kit`, because fast-growing
GitHub projects make discovery, topics, proof commands, launch copy, and
contributor checklists visible instead of leaving maintainers to hand-compose
them after the tool already works.
ContextForge v0.32.0 adds `contextforge compare`, because category leaders make
their alternatives and complements obvious. ContextForge should explain why it
exists next to Repomix, ccusage, promptfoo, security scanners, and project
memory conventions without burying that answer deep in the README.
ContextForge v0.33.0 adds `Launch profile surfaces` to `contextforge doctor`,
because stars and external adoption depend on README-visible demo assets,
generated launch copy, and category positioning staying present after the CLI
changes.
ContextForge v0.34.0 adds `contextforge proof-pack`, because current
agent-context tools compete on immediate proof. A maintainer should be able to
hand one Markdown packet to a visitor, reviewer, or coding agent and show the
doctor status, audit scores, rerun commands, and next handoff step together.
ContextForge v0.35.0 adds proof-pack artifacts to the reusable GitHub Action,
generated audit workflow, and dogfood workflow, because proof that stays only on
a laptop is weaker than proof attached to every CI run.
ContextForge v0.36.0 adds proof-pack visibility to PR-ready comments, because
the review discussion is the fastest path from "the gate passed" to "here is
the deeper doctor/audit packet reviewers can verify."
ContextForge v0.37.0 adds `contextforge review-kit`, because AI code review is
becoming a primary agent workflow and reviewers need a deterministic brief that
connects changed files, risk focus, proof commands, and a Codex/Claude prompt.
ContextForge v0.38.0 adds review-kit artifacts to the reusable GitHub Action,
generated audit workflow, and dogfood workflow, because PR review briefs become
more useful when every CI run uploads them next to audit and proof-pack evidence.
ContextForge v0.39.0 points PR-ready comments at `contextforge-review-kit.md`,
because GitHub review discussions should link directly to both the proof packet
and the changed-file Codex/Claude review brief.
ContextForge v0.40.0 adds `contextforge artifact-map`, because growing proof
surfaces create their own discovery problem: maintainers, reviewers, Codex, and
Claude need one deterministic guide that says which artifact to inspect first.
ContextForge v0.41.0 uploads that map from the reusable GitHub Action and
dogfood workflow, because GitHub Actions artifacts are the durable review
surface where maintainers inspect proof after a CI run.
ContextForge v0.42.0 adds `contextforge publish-readiness`, because first npm
publish should be a verifiable supply-chain handoff: repo metadata and workflow
safety can pass locally, while npm account ownership and Trusted Publisher
configuration stay explicitly human-approved.
ContextForge v0.43.0 adds npm provenance metadata checks and Node 24 workflow
opt-in, because package trust includes both registry-readable repository links
and CI workflows that are ready for GitHub's JavaScript action runtime
migration.
ContextForge v0.44.0 adds `contextforge scorecard`, because adjacent tools are
strong at deep packing or token dashboards, while repo visitors and coding
agents still need a short answer to whether a repository is ready for
Codex/Claude before opening a long proof artifact.

## 2026 Token Dashboard and Context Registry Snapshot

May 31, 2026 research shows heavy movement around local-first token visibility
and reusable context distribution:

| Project | Current signal | What it suggests for ContextForge |
| --- | --- | --- |
| [Token Use](https://tokenuse.app/) | Local dashboard for Claude Code, Codex, Cursor, GitHub Copilot, and Gemini history. | Do not compete as a general dashboard; focus on repo readiness and CI artifacts that dashboards do not own. |
| [Token Tracker](https://www.tokentracker.cc/) | Local-first usage tracker across many AI coding CLIs with one-command install and privacy-first positioning. | Keep ContextForge local-first, but make the first useful artifact a repo gate and action plan instead of another trend chart. |
| [TarsHub](https://tarshub.com/) | Registry for AGENTS.md, Cursor rules, and task prompts. | ContextForge should validate and score context packages before maintainers trust them. |
| [AGENTS.md evaluation](https://arxiv.org/abs/2602.11988) | Research reports that context files can reduce task success and raise inference cost when they contain unnecessary requirements. | Keep pushing minimal, measured repo instructions and make `contextforge plan` prioritize removal of noisy or unsafe guidance. |
| [OpenAI AGENTS.md](https://github.com/openai/agents.md) | AGENTS.md is positioned as a predictable place to give coding agents project context. | Support the convention, but scaffold minimal operational guidance and audit it continuously. |
| [Claude Code memory docs](https://docs.claude.com/en/docs/claude-code/memory) | Claude project memory lives in `CLAUDE.md` and works best with specific, structured instructions. | Generate concise Claude memory alongside AGENTS.md and keep it inside the same audit loop. |
| [CSA README injection note](https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/03/CSA_research_note_readme_instruction_injection_ai_coding_agents_20260317-csa-styled.pdf) | Repository files can become an instruction-injection surface for coding agents. | Keep security findings first in the action plan and preserve SARIF/Code Scanning integration. |
| [CodeIPI](https://ukgovernmentbeis.github.io/inspect_evals/evals/safeguards/ipi_coding_agent/index.html) | Indirect prompt injection benchmark embeds attacks in software engineering artifacts including README files and code comments. | Treat README as a first-class audit target while keeping the default scope deterministic and local-first. |

## 2026 Security Scanner Snapshot

May 31, 2026 GitHub and web research shows a fast-growing cluster around agent
security, prompt injection, MCP/tool poisoning, and malicious repo context:

| Project | Current signal | What it suggests for ContextForge |
| --- | ---: | --- |
| [agent-audit](https://github.com/HeadyZhang/agent-audit) | 170+ stars | Security scanners are moving toward OWASP-style agent rule packs; ContextForge should keep rules transparent and CI-friendly. |
| [agent-security-scanner-mcp](https://github.com/sinewaveai/agent-security-scanner-mcp) | 100+ stars | MCP-native scanning is emerging; ContextForge can complement that with repo-instruction gates before agents ingest context. |
| [aguara](https://github.com/garagon/aguara) | 80+ stars | Supply-chain plus prompt-injection scanning is converging; ContextForge should stay narrow but benchmarked. |
| [Sunglasses](https://sunglasses.dev/) | public OSS scanner | Market language is converging on malicious READMEs, tool poisoning, and credential exfiltration. |
| [SkillScan](https://skillscan.sh/) | public OSS scanner suite | Skill and MCP security tools emphasize rule counts and CI/SARIF; ContextForge should emphasize reproducible fixtures and low-friction repo audits. |

## Product Gap

Current projects cluster around three shapes:

- usage dashboards
- context packers
- runtime wrappers or MCP plugins

ContextForge should own a fourth shape:

> CI-ready context quality audits for coding-agent repositories.

With v0.17.0, it should also own the follow-through:

> agent-readable fix plans generated from those audits.

With v0.18.0, ContextForge also owns the bootstrap moment:

> minimal, test-oriented context files that are immediately auditable.

With v0.19.0, ContextForge treats the README as part of the security boundary:

> repository entrypoints that agents read are scanned before agents trust them.

With v0.20.0, ContextForge also makes its value inspectable without setup:

> deterministic demo output that can be regenerated and reviewed in public.

With v0.21.0, ContextForge makes the CI result easier to discuss in reviews:

> deterministic PR comments that summarize gates, scores, and top agent fixes.

With v0.22.0, ContextForge makes that review loop one command to adopt:

> opt-in sticky PR comment workflow scaffolding with explicit write permissions,
> plus `init --all` for the full recommended setup.

With v0.23.0, ContextForge makes the repository easier for agents to enter:

> root `llms.txt` and `llms-full.txt` maps that point Codex and Claude at the
> docs, commands, safety model, and proof surfaces that matter.

With v0.24.0, ContextForge makes the value proposition easier to scan:

> use-case-first onboarding that maps maintainer problems to commands,
> artifacts, and success signals.

With v0.25.0, ContextForge makes rule improvement automation easier:

> machine-readable `improve --json` suggestions that agents and bots can parse
> without scraping Markdown.

With v0.26.0, ContextForge makes that structure available in CI:

> `contextforge-suggestions.json` travels with the audit artifacts so downstream
> agents and bots can act after the check finishes.

With v0.27.0, ContextForge makes the audit visible at a glance:

> `contextforge-badge.svg` turns context health, cache stability, and security
> scores into a small status artifact for repository surfaces.

With v0.28.0, ContextForge checks launch trust surfaces up front:

> `contextforge doctor` warns when the repo lacks the README, license,
> contribution, changelog, demo, or LLM-discovery files visitors and agents need.

With v0.29.0, ContextForge checks collaboration trust surfaces up front:

> `contextforge doctor` warns when the repo lacks Code of Conduct, security
> policy, issue templates, or pull request template files contributors need.

With v0.30.0, ContextForge makes first-run proof portable:

> `contextforge doctor --summary contextforge-doctor.md` writes a Markdown
> checklist for README updates, issues, PRs, and build-in-public launch posts.

With v0.31.0, ContextForge makes the launch narrative reproducible:

> `contextforge launch-kit --output docs/launch-post.md` writes a one-liner,
> proof commands, suggested GitHub topics, launch post draft, and maintainer
> checklist from the same product positioning.

With v0.32.0, ContextForge makes the category boundary reproducible:

> `contextforge compare --output docs/comparison.md` writes a guide that shows
> how ContextForge complements repo packers, token dashboards, prompt/eval
> tools, security scanners, and agent memory conventions.

With v0.33.0, ContextForge makes the launch profile auditable:

> `contextforge doctor` checks the terminal demo asset, report screenshot,
> launch kit, and comparison guide that repo visitors use to decide whether the
> project is worth starring, trying, or sharing.

With v0.34.0, ContextForge makes the evidence packet portable:

> `contextforge proof-pack --output contextforge-proof-pack.md` writes a single
> Markdown proof packet with doctor checks, audit scores, rerun commands, and
> Codex/Claude handoff guidance.

With v0.35.0, ContextForge makes that packet CI-visible:

> the reusable GitHub Action, generated audit workflow, and dogfood workflow
> upload `contextforge-proof-pack.md` as an artifact next to JSON, HTML, SARIF,
> summary, plan, PR comment, suggestions, and badge outputs.

With v0.36.0, ContextForge makes that packet review-visible:

> `contextforge-pr-comment.md` points reviewers at `contextforge-proof-pack.md`
> so a sticky PR comment can lead directly to the shareable doctor/audit proof.

With v0.37.0, ContextForge makes review handoffs deterministic:

> `contextforge review-kit --base main --output contextforge-review-kit.md`
> writes changed files, inferred review focus, proof commands, and a copyable
> Codex/Claude review prompt.

With v0.38.0, ContextForge makes review handoffs CI-visible:

> reusable and generated GitHub workflows upload `contextforge-review-kit.md`
> next to audit, summary, plan, PR comment, suggestions, badge, proof pack, and
> SARIF artifacts.

With v0.39.0, ContextForge makes review handoffs PR-visible:

> `contextforge-pr-comment.md` points reviewers at `contextforge-review-kit.md`
> as well as `contextforge-proof-pack.md`.

With v0.40.0, ContextForge makes proof surfaces navigable:

> `contextforge artifact-map --output docs/artifacts.md` writes a generated
> catalog of ContextForge outputs plus fast paths for PR review, Codex/Claude
> fix sessions, and public launch proof.

With v0.41.0, ContextForge makes that navigation CI-visible:

> reusable and generated GitHub workflows upload `contextforge-artifact-map.md`
> next to proof-pack, review-kit, audit, summary, plan, comment, suggestions,
> badge, and SARIF artifacts.

That means every repository can ask:

- Are our `AGENTS.md` / `CLAUDE.md` files helping or wasting context?
- Are we breaking prompt-cache stability with volatile prefixes?
- Which session/tool records burn the most tokens?
- Can a maintainer upload an HTML audit artifact on every PR?
- Can the project improve agent rules through measured feedback rather than prompt folklore?
- Are repo context files trying to override instructions, exfiltrate secrets, or weaken tool approvals?
- Is our README carrying instructions that an AI coding agent might mistake for trusted commands?
- Can a visitor see real token, audit, and handoff output before installing the CLI?
- Can reviewers see the agent-context gate directly in a PR discussion?
- Can maintainers add that PR comment without hand-copying a permission-sensitive workflow?
- Can a new repository adopt the whole ContextForge loop with one command?
- Can an AI coding agent find the right ContextForge docs without guessing from the README alone?
- Which concrete ContextForge workflow should a maintainer run for this problem?
- Can a bot or coding agent parse suggested repo-rule fixes without scraping text?
- Can CI hand those same suggestions to downstream automation as an artifact?
- Can visitors see agent-context readiness without opening a full report?
- Are the public proof files present before asking maintainers or agents to trust the repo?
- Can contributors find safe collaboration and security-reporting paths before opening issues or PRs?
- Can maintainers publish the first-run readiness report without hand-copying terminal output?
- Can maintainers generate launch copy and topic checklists from the same proof commands the CLI verifies?
- Can visitors understand why ContextForge exists next to the tools they already know?
- Can maintainers verify that README launch assets, launch copy, and comparison docs are present before asking for stars?
- Can maintainers share one deterministic proof packet instead of asking visitors or agents to inspect many artifacts?
- Can every PR and push publish that proof packet as a GitHub Actions artifact?
- Can PR reviewers discover the proof packet from the sticky comment?
- Can Codex, Claude, and human reviewers start from the same deterministic review brief?
- Can every PR upload that review brief as a GitHub Actions artifact?
- Can sticky PR comments point reviewers at that review brief immediately?
- Can reviewers and agents choose the right proof artifact without guessing from
  a long artifact list?
- Can every PR and push upload the artifact map beside the proof packet and
  review kit?

## Next Differentiators

1. GitHub Action mode with JSON and HTML artifacts.
2. Real local Codex and Claude Code parser coverage from synthetic fixtures.
3. Repo instruction security checks for prompt/context poisoning.
4. Task-specific context pack scoring that explains why each file was included.
5. Public malicious-context benchmark fixtures with expected findings and score ranges.
6. Agent action plans that turn failing audit evidence into the next scoped Codex/Claude task.
7. Minimal context-file scaffolds that prevent new repositories from starting with bloated instructions.
8. README prompt-injection coverage for repository entrypoints agents read by default.
9. Regenerable demo output that turns the README into a verifiable product surface.
10. PR-ready deterministic comments that make context quality visible during review.
11. One-command recommended setup for audit, PR comment, AGENTS.md, and CLAUDE.md.
12. LLM-readable discovery files that give agents a stable repository map.
13. Use-case-first onboarding for first PR gates, security defense, cache triage, and context packs.
14. Machine-readable improvement suggestions for Codex, Claude, bots, and CI scripts.
15. CI-uploaded suggestions artifacts for downstream agent automation.
16. Compact audit status badges for repo surfaces and maintainer dashboards.
17. Public proof surface checks for OSS launch trust.
18. Community health surface checks for contributor-ready agent repositories.
19. Shareable doctor Markdown reports for launch issues, PRs, README updates, and build-in-public posts.
20. Generated launch kits that keep public copy aligned with real proof commands.
21. Generated comparison guides that make adjacent-tool positioning explicit.
22. Launch profile checks for star-ready repository pages.
23. Portable proof packs that combine doctor, audit, command, and agent handoff evidence.
24. CI-uploaded proof-pack artifacts in reusable and generated GitHub workflows.
25. PR-visible proof-pack links in sticky review comments.
26. Review kits that turn changed files into Codex/Claude review prompts and evidence commands.
27. CI-uploaded review-kit artifacts in reusable and generated GitHub workflows.
28. PR-visible review-kit links in sticky review comments.
29. Generated artifact maps that route reviewers, agents, and launch visitors to the right proof file.
30. CI-uploaded artifact maps in reusable and generated GitHub workflows.
31. npm publish-readiness checks that separate repo-verifiable supply-chain setup from account-level maintainer steps.
32. npm provenance metadata and Node 24 workflow opt-in before the first public package.
33. README-ready agent readiness scorecards that summarize Codex/Claude readiness in one screen.
34. MCP exposure audits that make agent tool config risk visible in CLI, doctor, scorecard, and CI artifacts.
35. MCP permission exposure checks for auto-approved and broadly permitted agent tools.

## Explainability Direction

Recent context tools increasingly emphasize retrieval or indexing. ContextForge
should keep a maintainer-oriented explanation layer: every context pack should
show why a file was selected, how many points it received, and which signal
caused inclusion. This keeps the tool useful in PR review and CI artifacts, not
only during local prompting.

## Session-Derived Context Direction

Recent benchmark and tool signals point toward context systems that learn from
working traces instead of only ranking static repo text. ContextForge should use
that direction conservatively: deterministic scoring from local session records,
visible `Why included` reasons, and repo-first defaults that avoid surprising
large history scans.

The v0.7.0 scoring model adds three trace-derived signals:

- files mentioned near failures, errors, exceptions, or regressions
- files recently read or opened by tools
- files recently edited, patched, written, modified, or touched

This keeps ContextForge aligned with retrieval/context benchmarks while staying
small enough for CI and build-in-public maintenance.

## Codex Session Format Direction

Local Codex tooling is converging around JSONL rollout/session files under
`~/.codex`, but the shape is not only simple `{role, content}` chat records.
Observed modern sessions include `session_meta`, `turn_context`, `event_msg`,
and `response_item` rows with nested `payload` data. ContextForge v0.8.0 parses
these shapes from synthetic fixtures and keeps local scanning bounded so a large
history folder cannot overwhelm the CLI.

## Package Trust Direction

Public maintainer tools earn trust faster when installation and release paths
are boring, inspectable, and reversible. npm's current guidance favors Trusted
Publishing/OIDC over long-lived automation tokens, with provenance generated for
public packages published from public GitHub repositories. ContextForge follows
that direction with a manual `npm Publish` workflow that defaults to dry-run and
expects maintainer approval before the first real publish.
ContextForge v0.42.0 turns that guidance into a first-class readiness report:
`contextforge publish-readiness --summary contextforge-publish-readiness.md`
checks package metadata, OIDC workflow safety, preflight commands, docs, and the
remaining human npm account setup without pretending account-level state can be
verified from the repository alone.
ContextForge v0.43.0 extends that report with package provenance metadata:
`repository.url`, `homepage`, and `bugs.url` must point back to the public
GitHub repo, and generated workflows opt into Node 24 JavaScript actions before
the GitHub Actions Node 20 runtime migration.
ContextForge v0.44.0 adds a shorter public proof layer:
`contextforge scorecard --output contextforge-scorecard.md` gives README
visitors, PR reviewers, Codex, and Claude the readiness score, key checks, next
actions, and links to deeper artifacts without requiring them to read the full
proof pack first.
ContextForge v0.45.0 adds `contextforge mcp-audit --summary
contextforge-mcp-audit.md`, because MCP adoption adds a committed configuration
surface where hardcoded secrets, remote shell installers, and unpinned package
launches can affect Codex, Claude, and other agent clients before normal code
review notices them.
ContextForge v0.46.0 extends that same static MCP gate to auto-approval and
broad permission grants, because the adjacent MCP security ecosystem is moving
toward runtime firewalls and gateways while maintainers still need a cheap
pre-agent PR check for risky committed client configuration.
