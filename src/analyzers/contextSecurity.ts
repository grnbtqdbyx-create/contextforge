import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ContextSecurityAudit, Finding, Severity } from '../types.js';
import { pathExists } from '../utils/files.js';

const SECURITY_CONTEXT_FILES = ['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.clinerules', 'SKILL.md'];

interface Rule {
  type: string;
  severity: Severity;
  patterns: RegExp[];
  message: string;
  suggestion: string;
}

const RULES: Rule[] = [
  {
    type: 'prompt-injection',
    severity: 'high',
    patterns: [
      /\bignore (all )?(previous|prior|above) instructions\b/i,
      /\breveal (the )?(system|developer) prompt\b/i,
      /\boverride (the )?(system|developer|safety) instructions\b/i
    ],
    message: 'contains instruction-override or prompt-leak language.',
    suggestion: 'Remove override/leak instructions and treat this file as untrusted repository content.'
  },
  {
    type: 'data-exfiltration',
    severity: 'high',
    patterns: [
      /\b(upload|send|post|exfiltrate|leak)\b[\s\S]{0,100}\b(\.env|ssh key|private key|api key|token|secret|credential)s?\b/i,
      /\b(curl|wget)\b[\s\S]{0,140}\b(\.env|private key|api key|token|secret|credential)s?\b/i
    ],
    message: 'appears to request credential or secret exfiltration.',
    suggestion: 'Delete the instruction and rotate exposed credentials if this content came from an untrusted source.'
  },
  {
    type: 'unsafe-shell',
    severity: 'high',
    patterns: [
      /\bcurl\b[^\n|;]*(\||>)\s*(bash|sh)\b/i,
      /\bwget\b[^\n|;]*(\||>)\s*(bash|sh)\b/i,
      /\brm\s+-rf\s+(\/|\$HOME|~|\*)/i
    ],
    message: 'contains unsafe shell execution guidance.',
    suggestion: 'Require explicit user approval and pin/inspect scripts before executing shell commands.'
  },
  {
    type: 'hidden-directive',
    severity: 'medium',
    patterns: [
      /\bdo not tell (the )?user\b/i,
      /\bhide this instruction\b/i,
      /\bsecretly\b/i,
      /\bsilently\b[\s\S]{0,60}\b(disable|bypass|skip)\b/i
    ],
    message: 'contains hidden or non-transparent behavior instructions.',
    suggestion: 'Remove hidden directives. Agent behavior should remain visible and reviewable.'
  },
  {
    type: 'permission-escalation',
    severity: 'medium',
    patterns: [
      /\bdisable (safety|security|approval|sandbox|guardrail)s?\b/i,
      /\bbypass (safety|security|approval|sandbox|guardrail)s?\b/i,
      /\brun with (admin|root|sudo)\b/i
    ],
    message: 'asks the agent to weaken safety or permission controls.',
    suggestion: 'Keep approval, sandbox, and security controls explicit and user-controlled.'
  }
];

export async function auditContextSecurity(options: { rootDir?: string } = {}): Promise<ContextSecurityAudit> {
  const rootDir = options.rootDir ?? process.cwd();
  const findings: Finding[] = [];

  for (const name of SECURITY_CONTEXT_FILES) {
    const filePath = path.join(rootDir, name);
    if (!(await pathExists(filePath))) continue;
    const content = await fs.readFile(filePath, 'utf8');
    for (const rule of RULES) {
      if (rule.patterns.some((pattern) => pattern.test(content))) {
        findings.push({
          file: name,
          type: rule.type,
          severity: rule.severity,
          message: `${name} ${rule.message}`,
          suggestion: rule.suggestion
        });
      }
    }
  }

  const uniqueFindings = dedupeFindings(findings);
  const penalty = uniqueFindings.reduce((total, finding) => total + (finding.severity === 'high' ? 25 : 12), 0);
  return {
    findings: uniqueFindings,
    score: Math.max(0, 100 - penalty)
  };
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
