import type { GithubActionsAudit } from '../analyzers/githubActions.js';
import type { Finding, Severity } from '../types.js';

export interface GithubActionsSarifLog {
  $schema: string;
  version: '2.1.0';
  runs: GithubActionsSarifRun[];
}

interface GithubActionsSarifRun {
  tool: {
    driver: {
      name: string;
      informationUri: string;
      rules: GithubActionsSarifRule[];
    };
  };
  results: GithubActionsSarifResult[];
}

interface GithubActionsSarifRule {
  id: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  defaultConfiguration: { level: GithubActionsSarifLevel };
}

interface GithubActionsSarifResult {
  ruleId: string;
  level: GithubActionsSarifLevel;
  message: { text: string };
  locations: GithubActionsSarifLocation[];
}

interface GithubActionsSarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number };
  };
  message: { text: string };
}

type GithubActionsSarifLevel = 'error' | 'warning' | 'note';

export function createGithubActionsSarif(audit: GithubActionsAudit): GithubActionsSarifLog {
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ContextForge GitHub Actions',
            informationUri: 'https://github.com/grnbtqdbyx-create/contextforge',
            rules: rulesFromFindings(audit.findings)
          }
        },
        results: audit.findings.map((finding) => ({
          ruleId: ruleId(finding.type),
          level: sarifLevel(finding.severity),
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file ?? '.github/workflows/workflow.yml' },
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

function rulesFromFindings(findings: Finding[]): GithubActionsSarifRule[] {
  const rules = new Map<string, GithubActionsSarifRule>();
  for (const finding of findings) {
    const id = ruleId(finding.type);
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

function ruleId(type: string): string {
  return `github-actions/${type}`;
}

function sarifLevel(severity: Severity): GithubActionsSarifLevel {
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
