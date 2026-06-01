#!/usr/bin/env node
import { promises as fs, realpathSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { scanClaudeSessions } from './scanners/claude.js';
import { scanCodexSessions } from './scanners/codex.js';
import { summarizeUsage } from './analyzers/usage.js';
import { auditContextFiles } from './analyzers/contextHealth.js';
import { auditCacheStability } from './analyzers/cacheAudit.js';
import { auditContextSecurity } from './analyzers/contextSecurity.js';
import { auditMcpExposure, createMcpExposureSummary, formatMcpExposureAudit } from './analyzers/mcpExposure.js';
import { auditClaudeSettings, createClaudeSettingsSummary, formatClaudeSettingsAudit } from './analyzers/claudeSettings.js';
import { auditAgenticWorkflows, createAgenticWorkflowSummary, formatAgenticWorkflowAudit } from './analyzers/agenticWorkflow.js';
import { auditGithubActions, createGithubActionsSummary, formatGithubActionsAudit } from './analyzers/githubActions.js';
import { auditTraceEfficiency, createTraceEfficiencySummary, formatTraceEfficiencyAudit } from './analyzers/traceEfficiency.js';
import { createCostEstimateSummary, estimateSessionCost, formatCostEstimate } from './analyzers/costEstimate.js';
import { createContextPack } from './pack/contextPack.js';
import { suggestRuleImprovements } from './improve/ruleSuggestions.js';
import { writeHtmlReport } from './report/htmlReport.js';
import { createSarifReport } from './report/sarifReport.js';
import { createMarkdownSummary } from './report/markdownSummary.js';
import { createActionPlan } from './report/actionPlan.js';
import { createAdoptionBrief } from './report/adoptionBrief.js';
import { createComparisonGuide } from './report/comparison.js';
import { createDemoOutput } from './report/demoOutput.js';
import { createLaunchKit } from './report/launchKit.js';
import { createLaunchSnapshot } from './report/launchSnapshot.js';
import { createClaudeSettingsSarif } from './report/claudeSettingsSarif.js';
import { createMcpExposureSarif } from './report/mcpSarif.js';
import { createAgenticWorkflowSarif } from './report/agenticWorkflowSarif.js';
import { createGithubActionsSarif } from './report/githubActionsSarif.js';
import { createPrComment } from './report/prComment.js';
import { createProofPack } from './report/proofPack.js';
import { createAgentReadinessScorecard, createAgentReadinessScorecardData } from './report/scorecard.js';
import { createReviewKit, demoReviewKitFiles } from './report/reviewKit.js';
import { createBadgeSvg } from './report/badge.js';
import { createArtifactMap } from './report/artifactMap.js';
import { collectAgentSurfaceDiffChanges, createAgentSurfaceDiff, createAgentSurfaceDiffMarkdown } from './report/agentSurfaceDiff.js';
import { createAgentSurfaceMap } from './report/agentSurfaceMap.js';
import { createAgentSurfaceInventory, createAgentSurfaceInventoryMarkdown } from './report/agentSurfaceInventory.js';
import { buildAudit } from './audit/buildAudit.js';
import { runSecurityBenchmark } from './benchmark/securityBenchmark.js';
import { createDoctorSummary, formatDoctor, runDoctor } from './doctor/doctor.js';
import { createNpmPublishReadiness, createNpmPublishReadinessSummary, formatNpmPublishReadiness } from './publish/npmReadiness.js';
import { scaffoldGithubActionWorkflow, scaffoldPrCommentWorkflow } from './init/githubAction.js';
import { scaffoldAgentContextFiles } from './init/agentContext.js';
import type { ScannerOptions, SessionRecord } from './types.js';

const execFileAsync = promisify(execFile);

export interface CliArgs {
  command: string;
  demo: boolean;
  codex: boolean;
  claude: boolean;
  task: string;
  budget: number;
  output: string;
  report: string;
  benchmarkDir: string | undefined;
  sarif: string | undefined;
  summary: string | undefined;
  plan: string | undefined;
  comment: string | undefined;
  suggestions: string | undefined;
  badge: string | undefined;
  sessions: boolean;
  json: boolean;
  write: boolean;
  openPr: boolean;
  all: boolean;
  githubAction: boolean;
  prCommentWorkflow: boolean;
  agentsMd: boolean;
  claudeMd: boolean;
  copilotInstructions: boolean;
  force: boolean;
  actionRef: string | undefined;
  projectName: string | undefined;
  baseRef: string;
  minContextScore: number;
  minCacheScore: number;
  minSecurityScore: number;
  maxFiles: number | undefined;
  maxFileBytes: number | undefined;
  inputPricePerMTok: number | undefined;
  cachedInputPricePerMTok: number | undefined;
  outputPricePerMTok: number | undefined;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case 'scan':
      await commandScan(args);
      break;
    case 'usage':
      await commandUsage(args);
      break;
    case 'cache-audit':
      await commandCacheAudit(args);
      break;
    case 'security-audit':
      await commandSecurityAudit(args);
      break;
    case 'security-benchmark':
      await commandSecurityBenchmark(args);
      break;
    case 'mcp-audit':
      await commandMcpAudit(args);
      break;
    case 'claude-audit':
      await commandClaudeAudit(args);
      break;
    case 'workflow-audit':
      await commandWorkflowAudit(args);
      break;
    case 'actions-audit':
      await commandActionsAudit(args);
      break;
    case 'trace-audit':
      await commandTraceAudit(args);
      break;
    case 'cost-estimate':
      await commandCostEstimate(args);
      break;
    case 'agents-md-audit':
      await commandContextAudit(args);
      break;
    case 'pack':
      await commandPack(args);
      break;
    case 'improve':
      await commandImprove(args);
      break;
    case 'report':
      await commandReport(args);
      break;
    case 'audit':
      await commandAudit(args);
      break;
    case 'doctor':
      await commandDoctor(args);
      break;
    case 'plan':
      await commandPlan(args);
      break;
    case 'examples':
      await commandExamples(args);
      break;
    case 'launch-kit':
      await commandLaunchKit(args);
      break;
    case 'launch-snapshot':
      await commandLaunchSnapshot(args);
      break;
    case 'adoption-brief':
      await commandAdoptionBrief(args);
      break;
    case 'compare':
      await commandCompare(args);
      break;
    case 'proof-pack':
      await commandProofPack(args);
      break;
    case 'scorecard':
      await commandScorecard(args);
      break;
    case 'review-kit':
      await commandReviewKit(args);
      break;
    case 'artifact-map':
      await commandArtifactMap(args);
      break;
    case 'surface-map':
      await commandSurfaceMap(args);
      break;
    case 'surface-inventory':
      await commandSurfaceInventory(args);
      break;
    case 'surface-diff':
      await commandSurfaceDiff(args);
      break;
    case 'publish-readiness':
      await commandPublishReadiness(args);
      break;
    case 'init':
      await commandInit(args);
      break;
    case 'help':
    default:
      printHelp();
  }
}

function parseArgs(argv: string[]): CliArgs {
  const command = argv.find((item) => !item.startsWith('-')) ?? 'help';
  const defaultOutput = defaultOutputForCommand(command);
  const providerFlagProvided = argv.includes('--codex') || argv.includes('--claude');
  const repoOnlyAudit = ['audit', 'doctor', 'proof-pack', 'scorecard'].includes(command) && !argv.includes('--demo') && !providerFlagProvided;
  return {
    command,
    demo: argv.includes('--demo'),
    codex: repoOnlyAudit ? false : argv.includes('--codex') || !argv.includes('--claude'),
    claude: repoOnlyAudit ? false : argv.includes('--claude') || !argv.includes('--codex'),
    task: valueAfter(argv, '--task') ?? 'understand this repository',
    budget: Number(valueAfter(argv, '--budget') ?? 20000),
    output: valueAfter(argv, '--output') ?? defaultOutput,
    report: valueAfter(argv, '--report') ?? 'contextforge-report.html',
    benchmarkDir: valueAfter(argv, '--benchmark-dir'),
    sarif: valueAfter(argv, '--sarif'),
    summary: valueAfter(argv, '--summary'),
    plan: valueAfter(argv, '--plan'),
    comment: valueAfter(argv, '--comment'),
    suggestions: valueAfter(argv, '--suggestions'),
    badge: valueAfter(argv, '--badge'),
    sessions: argv.includes('--sessions') || argv.includes('--demo') || providerFlagProvided,
    json: argv.includes('--json'),
    write: argv.includes('--write'),
    openPr: argv.includes('--open-pr'),
    all: argv.includes('--all'),
    githubAction: argv.includes('--all') || argv.includes('--github-action'),
    prCommentWorkflow: argv.includes('--all') || argv.includes('--pr-comment-workflow'),
    agentsMd: argv.includes('--all') || argv.includes('--agents-md'),
    claudeMd: argv.includes('--all') || argv.includes('--claude-md'),
    copilotInstructions: argv.includes('--all') || argv.includes('--copilot-instructions'),
    force: argv.includes('--force'),
    actionRef: valueAfter(argv, '--action-ref'),
    projectName: valueAfter(argv, '--project-name'),
    baseRef: valueAfter(argv, '--base') ?? 'main',
    minContextScore: Number(valueAfter(argv, '--min-context-score') ?? 60),
    minCacheScore: Number(valueAfter(argv, '--min-cache-score') ?? 60),
    minSecurityScore: Number(valueAfter(argv, '--min-security-score') ?? 60),
    maxFiles: optionalNumber(valueAfter(argv, '--max-session-files')),
    maxFileBytes: optionalMegabytes(valueAfter(argv, '--max-session-file-mb')),
    inputPricePerMTok: optionalNumber(valueAfter(argv, '--input-price-per-mtok')),
    cachedInputPricePerMTok: optionalNumber(valueAfter(argv, '--cached-input-price-per-mtok')),
    outputPricePerMTok: optionalNumber(valueAfter(argv, '--output-price-per-mtok'))
  };
}

export function scannerOptionsFromArgs(args: CliArgs): ScannerOptions {
  return {
    demo: args.demo,
    maxFiles: args.maxFiles,
    maxFileBytes: args.maxFileBytes
  };
}

async function loadRecords(args: CliArgs): Promise<SessionRecord[]> {
  const results: SessionRecord[][] = [];
  const scannerOptions = scannerOptionsFromArgs(args);
  if (args.claude) results.push(await scanClaudeSessions(scannerOptions));
  if (args.codex) results.push(await scanCodexSessions(scannerOptions));
  return results.flat();
}

async function commandScan(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  console.log(`ContextForge scan complete: ${records.length} records`);
  console.log(`Providers: ${[...new Set(records.map((record) => record.provider))].join(', ') || 'none'}`);
  if (records.length === 0) console.log('No local sessions found. Try --demo for fixture data.');
}

async function commandUsage(args: CliArgs): Promise<void> {
  const summary = summarizeUsage(await loadRecords(args));
  console.log(`Total tokens: ${summary.totalTokens}`);
  console.log(`Input: ${summary.inputTokens}  Output: ${summary.outputTokens}  Cached: ${summary.cachedTokens}`);
  printObjectTable('By kind', summary.byKind);
}

async function commandCacheAudit(args: CliArgs): Promise<void> {
  const audit = auditCacheStability(await loadRecords(args));
  console.log(`Cache Stability Score: ${audit.score}/100`);
  console.log(`Cache hit ratio: ${(audit.cacheHitRatio * 100).toFixed(1)}%`);
  printFindings(audit.findings);
}

async function commandContextAudit(args: CliArgs): Promise<void> {
  const audit = await auditContextFiles({ rootDir: args.demo ? 'fixtures/project' : process.cwd() });
  console.log(`Context Health Score: ${audit.score}/100`);
  console.log(`Context files: ${audit.files.map((file) => file.path).join(', ') || 'none'}`);
  printFindings(audit.findings);
}

async function commandSecurityAudit(args: CliArgs): Promise<void> {
  const audit = await auditContextSecurity({ rootDir: args.demo ? 'fixtures/security-project' : process.cwd() });
  console.log(`Context Security Score: ${audit.score}/100`);
  printFindings(audit.findings);
  if (audit.score < args.minSecurityScore) process.exitCode = 1;
}

async function commandSecurityBenchmark(args: CliArgs): Promise<void> {
  const benchmark = await runSecurityBenchmark({ benchmarkDir: args.benchmarkDir });
  const passedCases = benchmark.totalCases - benchmark.failedCases;
  console.log(`Security benchmark: ${benchmark.passed ? 'pass' : 'fail'} (${passedCases}/${benchmark.totalCases})`);
  for (const benchmarkCase of benchmark.cases) {
    console.log(
      `- ${benchmarkCase.name}: ${benchmarkCase.passed ? 'pass' : 'fail'} ` +
        `score ${benchmarkCase.actual.score}/100 findings ${formatFindingTypes(benchmarkCase.actual.findingTypes)}`
    );
    for (const failure of benchmarkCase.failures) console.log(`  FAIL: ${failure}`);
  }
  if (!benchmark.passed) process.exitCode = 1;
}

async function commandMcpAudit(args: CliArgs): Promise<void> {
  const audit = await auditMcpExposure({ rootDir: args.demo ? 'fixtures/mcp-risk-project' : process.cwd() });
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createMcpExposureSummary(audit));
  }
  if (args.sarif) {
    await fs.mkdir(dirname(args.sarif), { recursive: true });
    await fs.writeFile(args.sarif, `${JSON.stringify(createMcpExposureSarif(audit), null, 2)}\n`);
  }
  console.log(args.json ? JSON.stringify(audit, null, 2) : formatMcpExposureAudit(audit));
  const written = [args.summary, args.sarif].filter(Boolean);
  if (written.length > 0) {
    const message = `Wrote ${written.join(' and ')}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (audit.status === 'fail') process.exitCode = 1;
}

async function commandClaudeAudit(args: CliArgs): Promise<void> {
  const audit = await auditClaudeSettings({ rootDir: args.demo ? 'fixtures/claude-settings-risk' : process.cwd() });
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createClaudeSettingsSummary(audit));
  }
  if (args.sarif) {
    await fs.mkdir(dirname(args.sarif), { recursive: true });
    await fs.writeFile(args.sarif, `${JSON.stringify(createClaudeSettingsSarif(audit), null, 2)}\n`);
  }
  console.log(args.json ? JSON.stringify(audit, null, 2) : formatClaudeSettingsAudit(audit));
  const written = [args.summary, args.sarif].filter(Boolean);
  if (written.length > 0) {
    const message = `Wrote ${written.join(' and ')}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (audit.status === 'fail') process.exitCode = 1;
}

async function commandWorkflowAudit(args: CliArgs): Promise<void> {
  const audit = await auditAgenticWorkflows({ rootDir: args.demo ? 'fixtures/agentic-workflow-risk' : process.cwd() });
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createAgenticWorkflowSummary(audit));
  }
  if (args.sarif) {
    await fs.mkdir(dirname(args.sarif), { recursive: true });
    await fs.writeFile(args.sarif, `${JSON.stringify(createAgenticWorkflowSarif(audit), null, 2)}\n`);
  }
  console.log(args.json ? JSON.stringify(audit, null, 2) : formatAgenticWorkflowAudit(audit));
  const written = [args.summary, args.sarif].filter(Boolean);
  if (written.length > 0) {
    const message = `Wrote ${written.join(' and ')}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (audit.status === 'fail') process.exitCode = 1;
}

async function commandActionsAudit(args: CliArgs): Promise<void> {
  const audit = await auditGithubActions({ rootDir: process.cwd() });
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createGithubActionsSummary(audit));
  }
  if (args.sarif) {
    await fs.mkdir(dirname(args.sarif), { recursive: true });
    await fs.writeFile(args.sarif, `${JSON.stringify(createGithubActionsSarif(audit), null, 2)}\n`);
  }
  console.log(args.json ? JSON.stringify(audit, null, 2) : formatGithubActionsAudit(audit));
  const written = [args.summary, args.sarif].filter(Boolean);
  if (written.length > 0) {
    const message = `Wrote ${written.join(' and ')}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (audit.status === 'fail') process.exitCode = 1;
}

async function commandTraceAudit(args: CliArgs): Promise<void> {
  const audit = auditTraceEfficiency(await loadRecords(args));
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createTraceEfficiencySummary(audit));
  }
  console.log(args.json ? JSON.stringify(audit, null, 2) : formatTraceEfficiencyAudit(audit));
  if (args.summary) {
    const message = `Wrote ${args.summary}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
}

async function commandCostEstimate(args: CliArgs): Promise<void> {
  const estimate = estimateSessionCost(await loadRecords(args), {
    inputPerMTok: args.inputPricePerMTok,
    cachedInputPerMTok: args.cachedInputPricePerMTok,
    outputPerMTok: args.outputPricePerMTok
  });
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createCostEstimateSummary(estimate));
  }
  console.log(args.json ? JSON.stringify(estimate, null, 2) : formatCostEstimate(estimate));
  if (args.summary) {
    const message = `Wrote ${args.summary}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
}

async function commandPack(args: CliArgs): Promise<void> {
  const records = args.sessions ? await loadRecords(args) : [];
  const pack = await createContextPack({
    rootDir: args.demo ? 'fixtures/project' : process.cwd(),
    task: args.task,
    budget: args.budget,
    records
  });
  const output = valueAfter(process.argv.slice(2), '--output') ?? 'contextforge-pack.md';
  await fs.writeFile(output, pack.content);
  const budgetStatus = pack.budget.status === 'within-budget' ? 'within budget' : 'over budget';
  console.log(
    `Wrote ${output} with ${pack.files.length} files and ~${pack.estimatedTokens}/${pack.budget.requestedTokens} tokens (${budgetStatus}).`
  );
}

async function commandImprove(args: CliArgs): Promise<void> {
  const context = await auditContextFiles({ rootDir: args.demo ? 'fixtures/project' : process.cwd() });
  const cache = auditCacheStability(await loadRecords(args));
  const suggestions = suggestRuleImprovements({ contextFindings: context.findings, cacheFindings: cache.findings });
  if (args.json) {
    console.log(JSON.stringify({ schemaVersion: 1, suggestions }, null, 2));
    return;
  }
  for (const suggestion of suggestions) {
    console.log(`- ${suggestion.title}`);
    console.log(`  ${suggestion.text}`);
  }
  if (args.write) {
    await fs.writeFile('contextforge-suggestions.md', suggestions.map((item) => `- ${item.text}`).join('\n'));
    console.log('Wrote contextforge-suggestions.md');
  }
  if (args.openPr) {
    console.log('PR mode is intentionally explicit: create a branch, commit contextforge-suggestions.md, then run gh pr create.');
  }
}

async function commandReport(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  const context = await auditContextFiles({ rootDir: args.demo ? 'fixtures/project' : process.cwd() });
  const cache = auditCacheStability(records);
  const security = await auditContextSecurity({ rootDir: args.demo ? 'fixtures/project' : process.cwd() });
  const suggestions = suggestRuleImprovements({ contextFindings: [...context.findings, ...security.findings], cacheFindings: cache.findings });
  await writeHtmlReport({
    outputPath: args.output,
    usage: summarizeUsage(records),
    context,
    cache,
    security,
    suggestions
  });
  console.log(`Wrote ${args.output}`);
}

async function commandAudit(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  const rootDir = args.demo ? 'fixtures/project' : process.cwd();
  const audit = await buildAudit({
    records,
    rootDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  const context = await auditContextFiles({ rootDir });
  const cache = auditCacheStability(records);
  const security = await auditContextSecurity({ rootDir });
  const suggestions = suggestRuleImprovements({ contextFindings: [...context.findings, ...security.findings], cacheFindings: cache.findings });
  await fs.writeFile(args.output, `${JSON.stringify(audit, null, 2)}\n`);
  await writeHtmlReport({
    outputPath: args.report,
    usage: summarizeUsage(records),
    context,
    cache,
    security,
    suggestions
  });
  if (args.sarif) await fs.writeFile(args.sarif, `${JSON.stringify(createSarifReport(audit), null, 2)}\n`);
  if (args.summary) await fs.writeFile(args.summary, createMarkdownSummary(audit));
  if (args.plan) await fs.writeFile(args.plan, createActionPlan(audit));
  if (args.comment) {
    const surfaceDiff = createAgentSurfaceDiff({
      baseRef: args.baseRef,
      changes: await collectAgentSurfaceDiffChanges(args.baseRef)
    });
    await fs.writeFile(args.comment, createPrComment(audit, { surfaceDiff }));
  }
  if (args.suggestions) await fs.writeFile(args.suggestions, `${JSON.stringify({ schemaVersion: 1, suggestions }, null, 2)}\n`);
  if (args.badge) await fs.writeFile(args.badge, createBadgeSvg(audit));

  console.log(`ContextForge audit: ${audit.status}`);
  console.log(`Context health: ${audit.scores.contextHealth}/100  Cache stability: ${audit.scores.cacheStability}/100  Context security: ${audit.scores.contextSecurity}/100`);
  console.log(`Wrote ${[args.output, args.report, args.sarif, args.summary, args.plan, args.comment, args.suggestions, args.badge].filter(Boolean).join(' and ')}`);
  if (audit.failures.length > 0) {
    for (const failure of audit.failures) console.log(`FAIL: ${failure}`);
    process.exitCode = 1;
  }
}

async function commandDoctor(args: CliArgs): Promise<void> {
  const rootDir = args.demo ? 'fixtures/project' : process.cwd();
  const result = await runDoctor({
    rootDir,
    records: await loadRecords(args),
    benchmarkDir: args.benchmarkDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  if (args.summary) {
    await fs.writeFile(args.summary, createDoctorSummary(result));
  }
  console.log(args.json ? JSON.stringify(result, null, 2) : formatDoctor(result));
  if (args.summary) {
    const message = `Wrote ${args.summary}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (result.status === 'fail') process.exitCode = 1;
}

async function commandPlan(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  const rootDir = args.demo ? 'fixtures/project' : process.cwd();
  const audit = await buildAudit({
    records,
    rootDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });

  await fs.writeFile(args.output, createActionPlan(audit));
  console.log(`Wrote ${args.output}`);
  if (audit.status === 'fail') process.exitCode = 1;
}

async function commandExamples(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, await createDemoOutput());
  console.log(`Wrote ${args.output}`);
}

async function commandLaunchKit(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(
    args.output,
    createLaunchKit({
      projectName: args.projectName ?? 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    })
  );
  console.log(`Wrote ${args.output}`);
}

async function commandLaunchSnapshot(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(
    args.output,
    createLaunchSnapshot({
      projectName: args.projectName ?? 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    })
  );
  console.log(`Wrote ${args.output}`);
}

async function commandAdoptionBrief(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(
    args.output,
    createAdoptionBrief({
      projectName: args.projectName ?? 'ContextForge',
      repoUrl: 'https://github.com/grnbtqdbyx-create/contextforge'
    })
  );
  console.log(`Wrote ${args.output}`);
}

async function commandCompare(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createComparisonGuide());
  console.log(`Wrote ${args.output}`);
}

async function commandProofPack(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  const rootDir = args.demo ? 'fixtures/project' : process.cwd();
  const audit = await buildAudit({
    records,
    rootDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  const doctor = await runDoctor({
    rootDir,
    records,
    benchmarkDir: args.benchmarkDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createProofPack({ doctor, audit }));
  console.log(`Wrote ${args.output}`);
  if (doctor.status === 'fail' || audit.status === 'fail') process.exitCode = 1;
}

async function commandScorecard(args: CliArgs): Promise<void> {
  const records = await loadRecords(args);
  const rootDir = args.demo ? 'fixtures/project' : process.cwd();
  const audit = await buildAudit({
    records,
    rootDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  const doctor = await runDoctor({
    rootDir,
    records,
    benchmarkDir: args.benchmarkDir,
    minContextScore: args.minContextScore,
    minCacheScore: args.minCacheScore,
    minSecurityScore: args.minSecurityScore
  });
  const scorecard = createAgentReadinessScorecardData({ doctor, audit });
  if (args.json) {
    console.log(JSON.stringify(scorecard, null, 2));
    return;
  }
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createAgentReadinessScorecard(scorecard));
  console.log(`Wrote ${args.output}`);
  if (scorecard.status === 'fail') process.exitCode = 1;
}

async function commandReviewKit(args: CliArgs): Promise<void> {
  const changedFiles = args.demo ? demoReviewKitFiles() : await collectChangedFiles(args.baseRef);
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(
    args.output,
    createReviewKit({
      projectName: args.projectName ?? 'ContextForge',
      baseRef: args.baseRef,
      changedFiles
    })
  );
  console.log(`Wrote ${args.output}`);
}

async function commandArtifactMap(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createArtifactMap());
  console.log(`Wrote ${args.output}`);
}

async function commandSurfaceMap(args: CliArgs): Promise<void> {
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createAgentSurfaceMap());
  console.log(`Wrote ${args.output}`);
}

async function commandSurfaceInventory(args: CliArgs): Promise<void> {
  const inventory = await createAgentSurfaceInventory();
  if (args.json) {
    console.log(JSON.stringify(inventory, null, 2));
    return;
  }
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createAgentSurfaceInventoryMarkdown(inventory));
  console.log(`Wrote ${args.output}`);
}

async function commandSurfaceDiff(args: CliArgs): Promise<void> {
  const diff = createAgentSurfaceDiff({
    baseRef: args.baseRef,
    changes: await collectAgentSurfaceDiffChanges(args.baseRef)
  });
  if (args.json) {
    console.log(JSON.stringify(diff, null, 2));
    return;
  }
  await fs.mkdir(dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, createAgentSurfaceDiffMarkdown(diff));
  console.log(`Wrote ${args.output}`);
}

async function commandPublishReadiness(args: CliArgs): Promise<void> {
  const result = await createNpmPublishReadiness({ rootDir: process.cwd() });
  console.log(args.json ? JSON.stringify(result, null, 2) : formatNpmPublishReadiness(result));
  if (args.summary) {
    await fs.mkdir(dirname(args.summary), { recursive: true });
    await fs.writeFile(args.summary, createNpmPublishReadinessSummary(result));
    const message = `Wrote ${args.summary}`;
    if (args.json) console.error(message);
    else console.log(message);
  }
  if (result.status === 'fail') process.exitCode = 1;
}

async function commandInit(args: CliArgs): Promise<void> {
  if (!args.githubAction && !args.prCommentWorkflow && !args.agentsMd && !args.claudeMd && !args.copilotInstructions) {
    console.log('Choose what to initialize. Try: contextforge init --all');
    process.exitCode = 1;
    return;
  }

  if (args.githubAction) {
    const result = await scaffoldGithubActionWorkflow({
      rootDir: process.cwd(),
      actionRef: args.actionRef,
      force: args.force
    });
    printScaffoldResult(result.path, result.created);
  }

  if (args.prCommentWorkflow) {
    const result = await scaffoldPrCommentWorkflow({
      rootDir: process.cwd(),
      force: args.force
    });
    printScaffoldResult(result.path, result.created);
  }

  if (args.agentsMd || args.claudeMd || args.copilotInstructions) {
    const results = await scaffoldAgentContextFiles({
      rootDir: process.cwd(),
      agentsMd: args.agentsMd,
      claudeMd: args.claudeMd,
      copilotInstructions: args.copilotInstructions,
      projectName: args.projectName,
      force: args.force
    });
    for (const result of results) printScaffoldResult(result.path, result.created);
  }
}

function printObjectTable(title: string, table: Record<string, { totalTokens: number; records: number }>): void {
  console.log(title);
  for (const [key, value] of Object.entries(table)) {
    if (value.records > 0) console.log(`  ${key.padEnd(10)} ${String(value.totalTokens).padStart(8)} tokens (${value.records} records)`);
  }
}

function printFindings(findings: Array<{ severity: string; type: string; message: string; suggestion: string }>): void {
  if (findings.length === 0) {
    console.log('No findings.');
    return;
  }
  for (const finding of findings) {
    console.log(`[${finding.severity}] ${finding.type}: ${finding.message}`);
    console.log(`  Suggestion: ${finding.suggestion}`);
  }
}

function formatFindingTypes(types: string[]): string {
  return types.length > 0 ? types.join(', ') : 'none';
}

function valueAfter(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function defaultOutputForCommand(command: string): string {
  if (command === 'audit') return 'contextforge-audit.json';
  if (command === 'plan') return 'contextforge-agent-plan.md';
  if (command === 'examples') return 'examples/demo-output.md';
  if (command === 'launch-kit') return 'docs/launch-post.md';
  if (command === 'launch-snapshot') return 'docs/launch-snapshot.md';
  if (command === 'adoption-brief') return 'docs/adoption.md';
  if (command === 'compare') return 'docs/comparison.md';
  if (command === 'mcp-audit') return 'contextforge-mcp-audit.md';
  if (command === 'workflow-audit') return 'contextforge-workflow-audit.md';
  if (command === 'actions-audit') return 'contextforge-actions-audit.md';
  if (command === 'trace-audit') return 'contextforge-trace-audit.md';
  if (command === 'cost-estimate') return 'contextforge-cost-estimate.md';
  if (command === 'proof-pack') return 'contextforge-proof-pack.md';
  if (command === 'scorecard') return 'contextforge-scorecard.md';
  if (command === 'review-kit') return 'contextforge-review-kit.md';
  if (command === 'artifact-map') return 'docs/artifacts.md';
  if (command === 'surface-map') return 'contextforge-agent-surface-map.md';
  if (command === 'surface-inventory') return 'contextforge-agent-surface-inventory.md';
  if (command === 'surface-diff') return 'contextforge-agent-surface-diff.md';
  if (command === 'publish-readiness') return 'contextforge-publish-readiness.md';
  return 'contextforge-report.html';
}

export async function collectChangedFiles(baseRef: string, cwd: string = process.cwd()): Promise<string[]> {
  const files = new Set<string>();
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB', `${baseRef}...HEAD`], {
      cwd
    });
    for (const file of stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)) {
      files.add(file);
    }
  } catch {
    // Keep review-kit usable in shallow clones or repositories without the base ref.
  }
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB'], { cwd });
    for (const file of stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)) {
      files.add(file);
    }
  } catch {
    // Ignore non-git directories; the generated kit will explain that no files were detected.
  }
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '--others', '--exclude-standard'], { cwd });
    for (const file of stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)) {
      files.add(file);
    }
  } catch {
    // Ignore non-git directories; the generated kit will explain that no files were detected.
  }
  return [...files].sort();
}

function optionalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalMegabytes(value: string | undefined): number | undefined {
  const parsed = optionalNumber(value);
  return parsed === undefined ? undefined : Math.max(1, parsed) * 1024 * 1024;
}

function pathRelativeToCwd(filePath: string): string {
  return filePath.startsWith(process.cwd()) ? filePath.slice(process.cwd().length + 1) : filePath;
}

function printScaffoldResult(filePath: string, created: boolean): void {
  const relativePath = pathRelativeToCwd(filePath);
  if (created) {
    console.log(`Wrote ${relativePath}`);
    return;
  }
  console.log(`Skipped ${relativePath} because it already exists. Use --force to overwrite.`);
}

export function isCliEntrypoint(moduleUrl: string, argvPath: string | undefined = process.argv[1]): boolean {
  if (!argvPath) return false;
  return realPath(fileURLToPath(moduleUrl)) === realPath(argvPath);
}

function realPath(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
}

function printHelp(): void {
  console.log(`ContextForge

Usage:
  contextforge scan [--demo] [--codex] [--claude]
  contextforge usage [--demo] [--codex] [--claude]
  contextforge cache-audit [--demo]
  contextforge security-audit [--demo] [--min-security-score 60]
  contextforge security-benchmark [--benchmark-dir fixtures/security-benchmark]
  contextforge mcp-audit [--demo] [--json] [--summary contextforge-mcp-audit.md] [--sarif contextforge-mcp.sarif]
  contextforge claude-audit [--demo] [--json] [--summary contextforge-claude-audit.md] [--sarif contextforge-claude.sarif]
  contextforge workflow-audit [--demo] [--json] [--summary contextforge-workflow-audit.md] [--sarif contextforge-workflow.sarif]
  contextforge actions-audit [--json] [--summary contextforge-actions-audit.md] [--sarif contextforge-actions.sarif]
  contextforge trace-audit [--demo] [--json] [--summary contextforge-trace-audit.md]
  contextforge cost-estimate [--demo] [--json] [--summary contextforge-cost-estimate.md] [--input-price-per-mtok 0] [--cached-input-price-per-mtok 0] [--output-price-per-mtok 0]
  contextforge agents-md-audit [--demo]
  contextforge pack --task "fix auth bug" --budget 20000 [--demo] [--sessions] [--codex] [--claude] [--output contextforge-pack.md]
  contextforge improve [--demo] [--json] [--write] [--open-pr]
  contextforge report [--demo] [--output contextforge-report.html]
  contextforge audit [--demo] [--output contextforge-audit.json] [--report contextforge-report.html] [--sarif contextforge.sarif] [--summary contextforge-summary.md] [--plan contextforge-agent-plan.md] [--comment contextforge-pr-comment.md] [--suggestions contextforge-suggestions.json] [--badge contextforge-badge.svg] [--base main] [--min-security-score 60]
  contextforge doctor [--demo] [--json] [--summary contextforge-doctor.md] [--benchmark-dir fixtures/security-benchmark]
  contextforge plan [--demo] [--output contextforge-agent-plan.md] [--min-context-score 60] [--min-cache-score 60] [--min-security-score 60]
  contextforge examples [--output examples/demo-output.md]
  contextforge launch-kit [--output docs/launch-post.md] [--project-name "My App"]
  contextforge launch-snapshot [--output docs/launch-snapshot.md] [--project-name "My App"]
  contextforge adoption-brief [--output docs/adoption.md] [--project-name "My App"]
  contextforge compare [--output docs/comparison.md]
  contextforge proof-pack [--demo] [--output contextforge-proof-pack.md]
  contextforge scorecard [--demo] [--json] [--output contextforge-scorecard.md]
  contextforge review-kit [--demo] [--base main] [--output contextforge-review-kit.md]
  contextforge artifact-map [--output docs/artifacts.md]
  contextforge surface-map [--output contextforge-agent-surface-map.md]
  contextforge surface-inventory [--json] [--output contextforge-agent-surface-inventory.md]
  contextforge surface-diff [--base main] [--json] [--output contextforge-agent-surface-diff.md]
  contextforge publish-readiness [--json] [--summary contextforge-publish-readiness.md]
  contextforge init [--all] [--github-action] [--pr-comment-workflow] [--agents-md] [--claude-md] [--copilot-instructions] [--project-name "My App"] [--action-ref grnbtqdbyx-create/contextforge@v0.73.0] [--force]

Session scan safety:
  --max-session-files 50       newest JSONL files to scan per provider
  --max-session-file-mb 5      skip larger session files
`);
}

if (isCliEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
