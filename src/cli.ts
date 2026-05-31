#!/usr/bin/env node
import { promises as fs, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scanClaudeSessions } from './scanners/claude.js';
import { scanCodexSessions } from './scanners/codex.js';
import { summarizeUsage } from './analyzers/usage.js';
import { auditContextFiles } from './analyzers/contextHealth.js';
import { auditCacheStability } from './analyzers/cacheAudit.js';
import { auditContextSecurity } from './analyzers/contextSecurity.js';
import { createContextPack } from './pack/contextPack.js';
import { suggestRuleImprovements } from './improve/ruleSuggestions.js';
import { writeHtmlReport } from './report/htmlReport.js';
import { createSarifReport } from './report/sarifReport.js';
import { createMarkdownSummary } from './report/markdownSummary.js';
import { createActionPlan } from './report/actionPlan.js';
import { buildAudit } from './audit/buildAudit.js';
import { runSecurityBenchmark } from './benchmark/securityBenchmark.js';
import { formatDoctor, runDoctor } from './doctor/doctor.js';
import { scaffoldGithubActionWorkflow } from './init/githubAction.js';
import { scaffoldAgentContextFiles } from './init/agentContext.js';
import type { ScannerOptions, SessionRecord } from './types.js';

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
  sessions: boolean;
  json: boolean;
  write: boolean;
  openPr: boolean;
  githubAction: boolean;
  agentsMd: boolean;
  claudeMd: boolean;
  force: boolean;
  actionRef: string | undefined;
  projectName: string | undefined;
  minContextScore: number;
  minCacheScore: number;
  minSecurityScore: number;
  maxFiles: number | undefined;
  maxFileBytes: number | undefined;
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
  const repoOnlyAudit = ['audit', 'doctor'].includes(command) && !argv.includes('--demo') && !providerFlagProvided;
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
    sessions: argv.includes('--sessions') || argv.includes('--demo') || providerFlagProvided,
    json: argv.includes('--json'),
    write: argv.includes('--write'),
    openPr: argv.includes('--open-pr'),
    githubAction: argv.includes('--github-action'),
    agentsMd: argv.includes('--agents-md'),
    claudeMd: argv.includes('--claude-md'),
    force: argv.includes('--force'),
    actionRef: valueAfter(argv, '--action-ref'),
    projectName: valueAfter(argv, '--project-name'),
    minContextScore: Number(valueAfter(argv, '--min-context-score') ?? 60),
    minCacheScore: Number(valueAfter(argv, '--min-cache-score') ?? 60),
    minSecurityScore: Number(valueAfter(argv, '--min-security-score') ?? 60),
    maxFiles: optionalNumber(valueAfter(argv, '--max-session-files')),
    maxFileBytes: optionalMegabytes(valueAfter(argv, '--max-session-file-mb'))
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
  console.log(`Wrote ${output} with ${pack.files.length} files and ~${pack.estimatedTokens} tokens.`);
}

async function commandImprove(args: CliArgs): Promise<void> {
  const context = await auditContextFiles({ rootDir: args.demo ? 'fixtures/project' : process.cwd() });
  const cache = auditCacheStability(await loadRecords(args));
  const suggestions = suggestRuleImprovements({ contextFindings: context.findings, cacheFindings: cache.findings });
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

  console.log(`ContextForge audit: ${audit.status}`);
  console.log(`Context health: ${audit.scores.contextHealth}/100  Cache stability: ${audit.scores.cacheStability}/100  Context security: ${audit.scores.contextSecurity}/100`);
  console.log(`Wrote ${[args.output, args.report, args.sarif, args.summary, args.plan].filter(Boolean).join(' and ')}`);
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
  console.log(args.json ? JSON.stringify(result, null, 2) : formatDoctor(result));
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

async function commandInit(args: CliArgs): Promise<void> {
  if (!args.githubAction && !args.agentsMd && !args.claudeMd) {
    console.log('Choose what to initialize. Try: contextforge init --github-action --agents-md --claude-md');
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

  if (args.agentsMd || args.claudeMd) {
    const results = await scaffoldAgentContextFiles({
      rootDir: process.cwd(),
      agentsMd: args.agentsMd,
      claudeMd: args.claudeMd,
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
  return 'contextforge-report.html';
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
  contextforge agents-md-audit [--demo]
  contextforge pack --task "fix auth bug" --budget 20000 [--demo] [--sessions] [--codex] [--claude]
  contextforge improve [--demo] [--write] [--open-pr]
  contextforge report [--demo] [--output contextforge-report.html]
  contextforge audit [--demo] [--output contextforge-audit.json] [--report contextforge-report.html] [--sarif contextforge.sarif] [--summary contextforge-summary.md] [--plan contextforge-agent-plan.md] [--min-security-score 60]
  contextforge doctor [--demo] [--json] [--benchmark-dir fixtures/security-benchmark]
  contextforge plan [--demo] [--output contextforge-agent-plan.md] [--min-context-score 60] [--min-cache-score 60] [--min-security-score 60]
  contextforge init [--github-action] [--agents-md] [--claude-md] [--project-name "My App"] [--action-ref grnbtqdbyx-create/contextforge@v0.18.0] [--force]

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
