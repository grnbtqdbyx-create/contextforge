import { promises as fs } from 'node:fs';
import path from 'node:path';
import { redactSecrets, isLikelyBinary } from '../security/secrets.js';
import { estimateTokens } from '../tokenizers/index.js';
import { listFiles } from '../utils/files.js';

export interface ContextPackOptions {
  rootDir?: string;
  task: string;
  budget: number;
}

export interface PackedFile {
  path: string;
  estimatedTokens: number;
  score: number;
}

export interface ContextPack {
  files: PackedFile[];
  content: string;
  estimatedTokens: number;
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.toml', '.css', '.html', '.txt']);

export async function createContextPack(options: ContextPackOptions): Promise<ContextPack> {
  const rootDir = options.rootDir ?? process.cwd();
  const budget = Math.max(100, options.budget);
  const terms = options.task.toLowerCase().split(/[^a-z0-9_./-]+/).filter((term) => term.length > 2);
  const files = await listFiles(rootDir, (filePath) => TEXT_EXTENSIONS.has(path.extname(filePath)));
  const candidates: Array<PackedFile & { body: string }> = [];

  for (const file of files) {
    const buffer = await fs.readFile(file);
    if (isLikelyBinary(buffer)) continue;
    const relative = path.relative(rootDir, file);
    const body = redactSecrets(buffer.toString('utf8'));
    const haystack = `${relative}\n${body}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 4 : 0), 0) + (relative.includes('README') ? 1 : 0);
    candidates.push({ path: relative, estimatedTokens: estimateTokens(body), score, body });
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

  const content = [
    '# ContextForge Context Pack',
    '',
    `Task: ${options.task}`,
    `Budget: ${budget} tokens`,
    '',
    ...selected.flatMap((file) => [
      `## ${file.path}`,
      '',
      '```',
      trimToBudget(file.body, Math.max(50, budget - estimateTokens(selected.map((item) => item.path).join('\n')))),
      '```',
      ''
    ])
  ].join('\n');

  return {
    files: selected.map(({ body: _body, ...file }) => file),
    content,
    estimatedTokens: Math.min(estimateTokens(content), budget)
  };
}

function trimToBudget(content: string, budget: number): string {
  if (estimateTokens(content) <= budget) return content;
  const approxChars = Math.max(120, budget * 4);
  return `${content.slice(0, approxChars)}\n[ContextForge truncated this file to fit the token budget]`;
}

