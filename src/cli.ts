#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { scanClaudeSessions } from './scanners/claude.js';
import { scanCodexSessions } from './scanners/codex.js';
import { summarizeUsage } from './analyzers/usage.js';
import { auditContextFiles } from './analyzers/contextHealth.js';
import { auditCacheStability } from './analyzers/cacheAudit.js';
import { createContextPack } from './pack/contextPack.js';
import { suggestRuleImprovements } from './improve/ruleSuggestions.js';
import { writeHtmlReport } from './report/htmlReport.js';
import type { SessionRecord } from './types.js';

interface CliArgs {
  command: string;
  demo: boolean;
  codex: boolean;
  claude: boolean;
  task: string;
  budget: number;
  output: string;
  write: boolean;
  openPr: boolean;
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
    case 'help':
    default:
      printHelp();
  }
}

function parseArgs(argv: string[]): CliArgs {
  const command = argv.find((item) => !item.startsWith('-')) ?? 'help';
  return {
    command,
    demo: argv.includes('--demo'),
    codex: argv.includes('--codex') || !argv.includes('--claude'),
    claude: argv.includes('--claude') || !argv.includes('--codex'),
    task: valueAfter(argv, '--task') ?? 'understand this repository',
    budget: Number(valueAfter(argv, '--budget') ?? 20000),
    output: valueAfter(argv, '--output') ?? 'contextforge-report.html',
    write: argv.includes('--write'),
    openPr: argv.includes('--open-pr')
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
  const suggestions = suggestRuleImprovements({ contextFindings: context.findings, cacheFindings: cache.findings });
  await writeHtmlReport({
    outputPath: args.output,
    usage: summarizeUsage(records),
    context,
    cache,
    suggestions
  });
  console.log(`Wrote ${args.output}`);
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
  contextforge agents-md-audit [--demo]
  contextforge pack --task "fix auth bug" --budget 20000 [--demo]
  contextforge improve [--demo] [--write] [--open-pr]
  contextforge report [--demo] [--output contextforge-report.html]
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

