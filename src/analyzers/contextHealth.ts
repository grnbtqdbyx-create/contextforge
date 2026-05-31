import { promises as fs } from 'node:fs';
import type { ContextFileAudit, Finding } from '../types.js';
import { estimateTokens } from '../tokenizers/index.js';
import { listContextFiles } from '../utils/contextFiles.js';

const VAGUE_PATTERNS = [/\bbest practices\b/i, /\bmake (it|the code) good\b/i, /\bdo everything\b/i, /\balways be careful\b/i, /\bperfectly\b/i];

export async function auditContextFiles(options: { rootDir?: string } = {}): Promise<ContextFileAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const files: ContextFileAudit['files'] = [];
  const findings: Finding[] = [];

  for (const file of await listContextFiles(rootDir)) {
    const name = file.relativePath;
    const content = await fs.readFile(file.absolutePath, 'utf8');
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    files.push({ path: name, estimatedTokens: estimateTokens(content), bytes: Buffer.byteLength(content) });

    const seen = new Map<string, number>();
    for (const line of lines) {
      const count = (seen.get(line.toLowerCase()) ?? 0) + 1;
      seen.set(line.toLowerCase(), count);
      if (count === 2 && line.length > 8) {
        findings.push({
          file: name,
          type: 'repetition',
          severity: 'medium',
          message: `${name} repeats "${line.slice(0, 80)}".`,
          suggestion: `Deduplicate repeated instructions in ${name}.`
        });
      }
      const sentences = line.split(/[.!?]+/).map((sentence) => sentence.trim().toLowerCase()).filter((sentence) => sentence.length > 8);
      if (new Set(sentences).size < sentences.length) {
        findings.push({
          file: name,
          type: 'repetition',
          severity: 'medium',
          message: `${name} repeats a sentence within the same line.`,
          suggestion: `Remove repeated phrasing from ${name} so agents see each rule once.`
        });
      }
    }

    for (const pattern of VAGUE_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({
          file: name,
          type: 'vague',
          severity: 'medium',
          message: `${name} contains vague guidance that agents may over-apply.`,
          suggestion: `Replace vague guidance in ${name} with concrete repository-specific rules.`
        });
      }
    }

    if (estimateTokens(content) > 1200) {
      findings.push({
        file: name,
        type: 'excessive-length',
        severity: 'high',
        message: `${name} is large enough to consume meaningful context every turn.`,
        suggestion: `Move details into task-specific docs and keep ${name} minimal.`
      });
    }
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 25 : finding.severity === 'medium' ? 12 : 6), 0);
  return { files, findings: uniqueFindings, score: Math.max(0, 100 - penalty) };
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.type}:${finding.suggestion}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
