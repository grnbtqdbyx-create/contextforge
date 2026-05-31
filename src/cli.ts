#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { scanClaudeSessions } from './scanners/claude.js';
import { scanCodexSessions } from './scanners/codex.js';
import { summarizeUsage } from './analyzers/usage.js';
import { auditContextFiles } from './analyzers/contextHealth.js';
import { auditCacheStability } from './analyzers/cacheAudit.js';
import { auditContextSecurity } from './analyzers/contextSecurity.js';
import { createContextPack } from './pack/contextPack.js';
import { suggestRuleImprovements } from './improve/ruleSuggestions.js';
import { writeHtmlReport } from './report/htmlReport.js';
import { buildAudit } from './audit/buildAudit.js';
import { runSecurityBenchmark } from './benchmark/securityBenchmark.js';
import type { SessionRecord } from './types.js';

interface CliArgs {
  command: string;
  demo: boolean;
  codex: boolean;
  claude: boolean;
  task: string;
  budget: number;
  output: string;
  report: string;
  benchmarkDir: string | undefined;
  write: boolean;
  openPr: boolean;
  minContextScore: number;
  minCacheScore: number;
  minSecurityScore: number;
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
    case 'help':
    default:
      printHelp();
  }
}

function parseArgs(argv: string[]): CliArgs {
  const command = argv.find((item) => !item.startsWith('-')) ?? 'help';
  const defaultOutput = command === 'audit' ? 'contextforge-audit.json' : 'contextforge-report.html';
  const providerFlagProvided = argv.includes('--codex') || argv.includes('--claude');
  const repoOnlyAudit = command === 'audit' && !argv.includes('--demo') && !providerFlagProvided;
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
    write: argv.includes('--write'),
    openPr: argv.includes('--open-pr'),
    minContextScore: Number(valueAfter(argv, '--min-context-score') ?? 60),
    minCacheScore: Number(valueAfter(argv, '--min-cache-score') ?? 60),
    minSecurityScore: Number(valueAfter(argv, '--min-security-score') ?? 60)
  };
}

async function loadRecords(args: CliArgs): Promise<SessionRecord[]> {
  const results: SessionRecord[][] = [];
  if (args.claude) results.push(await scanClaudeSessions({ demo: args.demo }));
  if (args.codex) results.push(await scanCodexSessions({ demo: args.demo }));
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
  const pack = await createContextPack({
    rootDir: args.demo ? 'fixtures/project' : process.cwd(),
    task: args.task,
    budget: args.budget
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

  console.log(`ContextForge audit: ${audit.status}`);
  console.log(`Context health: ${audit.scores.contextHealth}/100  Cache stability: ${audit.scores.cacheStability}/100  Context security: ${audit.scores.contextSecurity}/100`);
  console.log(`Wrote ${args.output} and ${args.report}`);
  if (audit.failures.length > 0) {
    for (const failure of audit.failures) console.log(`FAIL: ${failure}`);
    process.exitCode = 1;
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

function printHelp(): void {
  console.log(`ContextForge

Usage:
  contextforge scan [--demo] [--codex] [--claude]
  contextforge usage [--demo] [--codex] [--claude]
  contextforge cache-audit [--demo]
  contextforge security-audit [--demo] [--min-security-score 60]
  contextforge security-benchmark [--benchmark-dir fixtures/security-benchmark]
  contextforge agents-md-audit [--demo]
  contextforge pack --task "fix auth bug" --budget 20000 [--demo]
  contextforge improve [--demo] [--write] [--open-pr]
  contextforge report [--demo] [--output contextforge-report.html]
  contextforge audit [--demo] [--output contextforge-audit.json] [--report contextforge-report.html] [--min-security-score 60]
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
