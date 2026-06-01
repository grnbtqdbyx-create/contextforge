import type { AgenticWorkflowAudit } from '../analyzers/agenticWorkflow.js';
import type { Finding, Severity } from '../types.js';

export interface AgenticWorkflowSarifLog {
  $schema: string;
  version: '2.1.0';
  runs: AgenticWorkflowSarifRun[];
}

interface AgenticWorkflowSarifRun {
  tool: {
    driver: {
      name: string;
      informationUri: string;
      rules: AgenticWorkflowSarifRule[];
    };
  };
  results: AgenticWorkflowSarifResult[];
}

interface AgenticWorkflowSarifRule {
  id: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  defaultConfiguration: { level: AgenticWorkflowSarifLevel };
}

interface AgenticWorkflowSarifResult {
  ruleId: string;
  level: AgenticWorkflowSarifLevel;
  message: { text: string };
  locations: AgenticWorkflowSarifLocation[];
}

interface AgenticWorkflowSarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number };
  };
  message: { text: string };
}

type AgenticWorkflowSarifLevel = 'error' | 'warning' | 'note';

export function createAgenticWorkflowSarif(audit: AgenticWorkflowAudit): AgenticWorkflowSarifLog {
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ContextForge Agentic Workflows',
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

function rulesFromFindings(findings: Finding[]): AgenticWorkflowSarifRule[] {
  const rules = new Map<string, AgenticWorkflowSarifRule>();
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
  return `agentic-workflow/${type}`;
}

function sarifLevel(severity: Severity): AgenticWorkflowSarifLevel {
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
