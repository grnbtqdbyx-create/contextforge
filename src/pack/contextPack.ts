import { promises as fs } from 'node:fs';
import path from 'node:path';
import { redactSecrets, isLikelyBinary } from '../security/secrets.js';
import { estimateTokens } from '../tokenizers/index.js';
import { isCopilotInstructionPath } from '../utils/contextFiles.js';
import { listFiles } from '../utils/files.js';
import type { SessionRecord } from '../types.js';

export interface ContextPackOptions {
  rootDir?: string;
  task: string;
  budget: number;
  records?: SessionRecord[];
}

export interface PackReason {
  type:
    | 'task-term-match'
    | 'path-match'
    | 'instruction-file'
    | 'manifest'
    | 'readme'
    | 'session-failure'
    | 'session-read'
    | 'session-edit';
  label: string;
  points: number;
}

export interface PackedFile {
  path: string;
  estimatedTokens: number;
  score: number;
  reasons: PackReason[];
}

export interface ContextPack {
  files: PackedFile[];
  content: string;
  estimatedTokens: number;
  budget: ContextPackBudget;
}

export interface ContextPackBudget {
  requestedTokens: number;
  estimatedTokens: number;
  remainingTokens: number;
  overflowTokens: number;
  status: 'within-budget' | 'over-budget';
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.toml', '.css', '.html', '.txt']);

export async function createContextPack(options: ContextPackOptions): Promise<ContextPack> {
  const rootDir = options.rootDir ?? process.cwd();
  const budget = Math.max(100, options.budget);
  const terms = options.task.toLowerCase().split(/[^a-z0-9_./-]+/).filter((term) => term.length > 2);
  const files = await listFiles(rootDir, (filePath) => TEXT_EXTENSIONS.has(path.extname(filePath)));
  const sessionSignals = buildSessionSignals(files.map((file) => path.relative(rootDir, file)), options.records ?? []);
  const candidates: Array<PackedFile & { body: string }> = [];

  for (const file of files) {
    const buffer = await fs.readFile(file);
    if (isLikelyBinary(buffer)) continue;
    const relative = path.relative(rootDir, file);
    const body = redactSecrets(buffer.toString('utf8'));
    const haystack = `${relative}\n${body}`.toLowerCase();
    const reasons = scoreReasons(relative, haystack, terms, sessionSignals.get(relative));
    const score = reasons.reduce((sum, reason) => sum + reason.points, 0);
    candidates.push({ path: relative, estimatedTokens: estimateTokens(body), score, reasons, body });
  }

  candidates.sort((a, b) => b.score - a.score || a.estimatedTokens - b.estimatedTokens);

  const selected: Array<PackedFile & { body: string }> = [];
  let used = estimateTokens(`# ContextForge Context Pack\nTask: ${options.task}\n`);
  for (const candidate of candidates) {
    if (candidate.score === 0 && selected.length > 0) continue;
    if (used + candidate.estimatedTokens > budget && selected.length > 0) continue;
    selected.push(candidate);
    used += candidate.estimatedTokens;
    if (used >= budget) break;
  }

  let content = renderPackContent(options.task, budget, selected);
  while (estimateTokens(content) > budget && selected.length > 0) {
    selected.pop();
    content = renderPackContent(options.task, budget, selected);
  }
  const budgetLedger = createBudgetLedger(budget, estimateTokens(content));

  return {
    files: selected.map(({ body: _body, ...file }) => file),
    content,
    estimatedTokens: budgetLedger.estimatedTokens,
    budget: budgetLedger
  };
}

function renderPackContent(task: string, budget: number, selected: Array<PackedFile & { body: string }>): string {
  let estimatedTokens = 0;
  let content = '';
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ledger = createBudgetLedger(budget, estimatedTokens);
    content = [
      '# ContextForge Context Pack',
      '',
      `Task: ${task}`,
      `Budget: ${budget} tokens`,
      '',
      '## Budget Ledger',
      '',
      `| Requested budget | ${ledger.requestedTokens} tokens |`,
      `| Estimated pack | ${ledger.estimatedTokens} tokens |`,
      `| Remaining | ${ledger.remainingTokens} tokens |`,
      `| Status | ${ledger.status === 'within-budget' ? 'within budget' : 'over budget'} |`,
      '',
      ...selected.flatMap((file) => [
        `## ${file.path}`,
        '',
        `Why included: ${formatReasons(file.reasons)}`,
        '',
        '```',
        trimToBudget(file.body, perFileBodyBudget(budget, selected.length)),
        '```',
        ''
      ])
    ].join('\n');
    const nextEstimate = estimateTokens(content);
    if (nextEstimate === estimatedTokens) break;
    estimatedTokens = nextEstimate;
  }
  return content;
}

function createBudgetLedger(requestedTokens: number, estimatedTokens: number): ContextPackBudget {
  const overflowTokens = Math.max(0, estimatedTokens - requestedTokens);
  return {
    requestedTokens,
    estimatedTokens,
    remainingTokens: Math.max(0, requestedTokens - estimatedTokens),
    overflowTokens,
    status: overflowTokens > 0 ? 'over-budget' : 'within-budget'
  };
}

function perFileBodyBudget(budget: number, fileCount: number): number {
  return Math.max(40, Math.floor((budget * 0.55) / Math.max(1, fileCount)));
}

function trimToBudget(content: string, budget: number): string {
  if (estimateTokens(content) <= budget) return content;
  const approxChars = Math.max(120, budget * 4);
  return `${content.slice(0, approxChars)}\n[ContextForge truncated this file to fit the token budget]`;
}

interface SessionSignals {
  failureMentions: number;
  reads: number;
  edits: number;
}

function scoreReasons(relative: string, haystack: string, terms: string[], signals?: SessionSignals): PackReason[] {
  const reasons: PackReason[] = [];
  const lowerPath = relative.toLowerCase();
  const matchedTerms = terms.filter((term) => haystack.includes(term));
  if (matchedTerms.length > 0) {
    reasons.push({
      type: 'task-term-match',
      label: `task term match: ${matchedTerms.slice(0, 5).join(', ')}`,
      points: matchedTerms.length * 4
    });
  }
  const pathMatches = terms.filter((term) => lowerPath.includes(term));
  if (pathMatches.length > 0) {
    reasons.push({
      type: 'path-match',
      label: `path match: ${pathMatches.slice(0, 5).join(', ')}`,
      points: pathMatches.length * 3
    });
  }
  if (/^(AGENTS|CLAUDE)\.md$|(\.cursorrules|\.clinerules)$/i.test(relative) || isCopilotInstructionPath(relative)) {
    reasons.push({
      type: 'instruction-file',
      label: 'repo-level agent instruction file',
      points: 3
    });
  }
  if (/^(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|tsconfig.*\.json)$/i.test(relative)) {
    reasons.push({
      type: 'manifest',
      label: 'project manifest/config file',
      points: 2
    });
  }
  if (/README\.md$/i.test(relative)) {
    reasons.push({
      type: 'readme',
      label: 'project README/orientation file',
      points: 1
    });
  }
  if (signals && signals.failureMentions > 0) {
    reasons.push({
      type: 'session-failure',
      label: `session failure mention: ${signals.failureMentions}`,
      points: Math.min(12, signals.failureMentions * 6)
    });
  }
  if (signals && signals.reads > 0) {
    reasons.push({
      type: 'session-read',
      label: `recent session read: ${signals.reads}`,
      points: Math.min(8, signals.reads * 4)
    });
  }
  if (signals && signals.edits > 0) {
    reasons.push({
      type: 'session-edit',
      label: `recent session edit: ${signals.edits}`,
      points: Math.min(10, signals.edits * 5)
    });
  }
  return reasons;
}

function buildSessionSignals(files: string[], records: SessionRecord[]): Map<string, SessionSignals> {
  const signals = new Map<string, SessionSignals>();
  if (records.length === 0) return signals;

  const normalizedFiles = files.map((file) => ({ file, variants: fileReferenceVariants(file) }));
  for (const record of records) {
    const content = record.content.toLowerCase();
    for (const { file, variants } of normalizedFiles) {
      if (!variants.some((variant) => content.includes(variant))) continue;
      const signal = signals.get(file) ?? { failureMentions: 0, reads: 0, edits: 0 };
      if (isFailureRecord(record)) signal.failureMentions += 1;
      if (isReadRecord(record)) signal.reads += 1;
      if (isEditRecord(record)) signal.edits += 1;
      signals.set(file, signal);
    }
  }
  return signals;
}

function fileReferenceVariants(file: string): string[] {
  const normalized = file.toLowerCase();
  return [normalized, `./${normalized}`, normalized.replaceAll('/', path.sep)].filter((item, index, items) => items.indexOf(item) === index);
}

function isFailureRecord(record: SessionRecord): boolean {
  return /\b(fail(?:ed|ing|ure)?|error|exception|regression|stack trace)\b/i.test(record.content);
}

function isReadRecord(record: SessionRecord): boolean {
  return /\b(read|open|view|inspect|cat|sed|file_path)\b/i.test(`${record.toolName ?? ''} ${record.content}`);
}

function isEditRecord(record: SessionRecord): boolean {
  return /\b(edit|write|multiedit|patch|apply_patch|modified|touched)\b/i.test(`${record.toolName ?? ''} ${record.content}`);
}

function formatReasons(reasons: PackReason[]): string {
  if (reasons.length === 0) return 'fallback inclusion to preserve minimal context';
  return reasons.map((reason) => `${reason.label} (+${reason.points})`).join('; ');
}
