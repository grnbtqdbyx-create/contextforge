import type { AuditResult } from '../audit/buildAudit.js';
import type { Finding, Severity } from '../types.js';

export interface SarifLog {
  $schema: string;
  version: '2.1.0';
  runs: SarifRun[];
}

interface SarifRun {
  tool: {
    driver: {
      name: string;
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
}

interface SarifRule {
  id: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  defaultConfiguration: { level: SarifLevel };
}

interface SarifResult {
  ruleId: string;
  level: SarifLevel;
  message: { text: string };
  locations: SarifLocation[];
}

interface SarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number };
  };
  message: { text: string };
}

type SarifLevel = 'error' | 'warning' | 'note';

interface FindingWithGroup {
  group: 'context-health' | 'context-security';
  finding: Finding;
}

export function createSarifReport(audit: AuditResult): SarifLog {
  const findings = fileBackedFindings(audit);
  const rules = rulesFromFindings(findings);

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ContextForge',
            informationUri: 'https://github.com/grnbtqdbyx-create/contextforge',
            rules
          }
        },
        results: findings.map(({ group, finding }) => ({
          ruleId: ruleId(group, finding.type),
          level: sarifLevel(finding.severity),
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file ?? 'AGENTS.md' },
                region: { startLine: 1 }
              },
              message: { text: finding.suggestion }
            }
          ]
        }))
      }
    ]
  };
}

function fileBackedFindings(audit: AuditResult): FindingWithGroup[] {
  return [
    ...audit.findings.context.map((finding) => ({ group: 'context-health' as const, finding })),
    ...audit.findings.security.map((finding) => ({ group: 'context-security' as const, finding }))
  ].filter(({ finding }) => Boolean(finding.file));
}

function rulesFromFindings(findings: FindingWithGroup[]): SarifRule[] {
  const rules = new Map<string, SarifRule>();
  for (const { group, finding } of findings) {
    const id = ruleId(group, finding.type);
    if (rules.has(id)) continue;
    rules.set(id, {
      id,
      shortDescription: { text: titleCase(finding.type) },
      fullDescription: { text: finding.message },
      help: { text: finding.suggestion },
      defaultConfiguration: { level: sarifLevel(finding.severity) }
    });
  }
  return [...rules.values()];
}

function ruleId(group: FindingWithGroup['group'], type: string): string {
  return `${group}/${type}`;
}

function sarifLevel(severity: Severity): SarifLevel {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
