interface ArtifactMapRow {
  artifact: string;
  audience: string;
  useWhen: string;
  producedBy: string;
}

const artifactRows: ArtifactMapRow[] = [
  {
    artifact: 'contextforge-audit.json',
    audience: 'CI and automation bots',
    useWhen: 'you need machine-readable gates for context, cache, and security readiness',
    producedBy: '`contextforge audit`'
  },
  {
    artifact: 'contextforge-report.html',
    audience: 'Maintainers',
    useWhen: 'you want a visual report that can be opened locally or uploaded from CI',
    producedBy: '`contextforge audit` or `contextforge report`'
  },
  {
    artifact: 'contextforge.sarif',
    audience: 'GitHub Code Scanning',
    useWhen: 'you want file-backed alerts for risky repository instructions',
    producedBy: '`contextforge audit --sarif contextforge.sarif`'
  },
  {
    artifact: 'contextforge-summary.md',
    audience: 'GitHub Actions summary readers',
    useWhen: 'you need a readable readiness summary in a check run or artifact',
    producedBy: '`contextforge audit --summary contextforge-summary.md`'
  },
  {
    artifact: 'contextforge-agent-plan.md',
    audience: 'Codex and Claude',
    useWhen: 'you need prioritized fix instructions after a failing or warning audit',
    producedBy: '`contextforge plan` or `contextforge audit --plan contextforge-agent-plan.md`'
  },
  {
    artifact: 'contextforge-pr-comment.md',
    audience: 'PR reviewers',
    useWhen: 'you need a sticky PR summary that points at proof and review artifacts',
    producedBy: '`contextforge audit --comment contextforge-pr-comment.md`'
  },
  {
    artifact: 'contextforge-suggestions.json',
    audience: 'Bots and coding agents',
    useWhen: 'you need structured repository-rule improvement suggestions',
    producedBy: '`contextforge improve --json` or `contextforge audit --suggestions contextforge-suggestions.json`'
  },
  {
    artifact: 'contextforge-badge.svg',
    audience: 'README and dashboards',
    useWhen: 'you need a compact readiness badge for a public surface',
    producedBy: '`contextforge audit --badge contextforge-badge.svg`'
  },
  {
    artifact: 'contextforge-proof-pack.md',
    audience: 'Launch, review, and handoff readers',
    useWhen: 'you need one shareable proof file that combines doctor and audit evidence',
    producedBy: '`contextforge proof-pack`'
  },
  {
    artifact: 'contextforge-scorecard.md',
    audience: 'README visitors, reviewers, and coding agents',
    useWhen: 'you need a one-screen Codex and Claude readiness snapshot',
    producedBy: '`contextforge scorecard --output contextforge-scorecard.md`'
  },
  {
    artifact: 'contextforge-review-kit.md',
    audience: 'PR reviewers, Codex, and Claude',
    useWhen: 'you need changed-file review focus for agent-assisted PRs',
    producedBy: '`contextforge review-kit --base main --output contextforge-review-kit.md`'
  },
  {
    artifact: 'contextforge-doctor.md',
    audience: 'First-run and launch readers',
    useWhen: 'you need a first-run checklist for public readiness surfaces',
    producedBy: '`contextforge doctor --summary contextforge-doctor.md`'
  },
  {
    artifact: 'docs/artifacts.md',
    audience: 'Visitors, maintainers, and contributors',
    useWhen: 'you need a catalog that explains which generated artifact to inspect first',
    producedBy: '`contextforge artifact-map --output docs/artifacts.md`'
  },
  {
    artifact: 'contextforge-artifact-map.md',
    audience: 'CI artifact readers',
    useWhen: 'you need the same catalog attached to a GitHub Actions run',
    producedBy: '`contextforge artifact-map --output contextforge-artifact-map.md`'
  },
  {
    artifact: 'contextforge-publish-readiness.md',
    audience: 'Release maintainers',
    useWhen: 'you need npm metadata, provenance links, Trusted Publishing, and human approval readiness in one file',
    producedBy: '`contextforge publish-readiness --summary contextforge-publish-readiness.md`'
  },
  {
    artifact: 'docs/launch-post.md',
    audience: 'Build-in-public readers',
    useWhen: 'you need launch copy, proof commands, and topic suggestions',
    producedBy: '`contextforge launch-kit`'
  },
  {
    artifact: 'docs/comparison.md',
    audience: 'Tool evaluators',
    useWhen: 'you need to position ContextForge beside packers, token dashboards, evals, and scanners',
    producedBy: '`contextforge compare`'
  },
  {
    artifact: 'examples/demo-output.md',
    audience: 'First-time visitors',
    useWhen: 'you need deterministic demo output without local Codex or Claude logs',
    producedBy: '`contextforge examples`'
  },
  {
    artifact: 'examples/pr-comment.md',
    audience: 'PR reviewers',
    useWhen: 'you need to preview the sticky PR comment format',
    producedBy: '`contextforge audit --comment examples/pr-comment.md`'
  },
  {
    artifact: 'examples/review-kit.md',
    audience: 'PR reviewers and agents',
    useWhen: 'you need to preview the review-kit handoff without opening a live PR',
    producedBy: '`contextforge review-kit --demo --output examples/review-kit.md`'
  }
];

export function createArtifactMap(): string {
  const lines = [
    '# ContextForge Artifact Map',
    '',
    'Use this to decide which ContextForge artifact a maintainer, reviewer, CI bot, Codex, or Claude should inspect first.',
    '',
    '## Artifact Catalog',
    '',
    '| Artifact | Audience | Use it when | Produced by |',
    '| --- | --- | --- | --- |',
    ...artifactRows.map((row) => `| \`${row.artifact}\` | ${row.audience} | ${row.useWhen} | ${row.producedBy} |`),
    '',
    '## Fast Paths',
    '',
    '- For a PR reviewer: `contextforge-pr-comment.md` -> `contextforge-review-kit.md` -> `contextforge-proof-pack.md`.',
    '- For Codex/Claude fixing failures: `contextforge-agent-plan.md` -> `contextforge-summary.md` -> `contextforge-audit.json`.',
    '- For public launch: `contextforge-doctor.md` -> `contextforge-proof-pack.md` -> `docs/launch-post.md`.',
    '',
    '## Generate The Full Proof Set',
    '',
    '```bash',
    'contextforge artifact-map --output docs/artifacts.md',
    'contextforge artifact-map --output contextforge-artifact-map.md',
    'contextforge publish-readiness --summary contextforge-publish-readiness.md',
    'contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md --comment contextforge-pr-comment.md --suggestions contextforge-suggestions.json --badge contextforge-badge.svg',
    'contextforge proof-pack --output contextforge-proof-pack.md',
    'contextforge scorecard --output contextforge-scorecard.md',
    'contextforge review-kit --base main --output contextforge-review-kit.md',
    '```',
    ''
  ];
  return `${lines.join('\n')}\n`;
}
