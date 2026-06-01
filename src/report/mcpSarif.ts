import type { McpExposureAudit } from '../analyzers/mcpExposure.js';
import type { Finding, Severity } from '../types.js';

export interface McpSarifLog {
  $schema: string;
  version: '2.1.0';
  runs: McpSarifRun[];
}

interface McpSarifRun {
  tool: {
    driver: {
      name: string;
      informationUri: string;
      rules: McpSarifRule[];
    };
  };
  results: McpSarifResult[];
}

interface McpSarifRule {
  id: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  defaultConfiguration: { level: McpSarifLevel };
}

interface McpSarifResult {
  ruleId: string;
  level: McpSarifLevel;
  message: { text: string };
  locations: McpSarifLocation[];
}

interface McpSarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number };
  };
  message: { text: string };
}

type McpSarifLevel = 'error' | 'warning' | 'note';

export function createMcpExposureSarif(audit: McpExposureAudit): McpSarifLog {
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ContextForge MCP Exposure',
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
                artifactLocation: { uri: finding.file ?? 'mcp.json' },
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

function rulesFromFindings(findings: Finding[]): McpSarifRule[] {
  const rules = new Map<string, McpSarifRule>();
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
  return `mcp-exposure/${type}`;
}

function sarifLevel(severity: Severity): McpSarifLevel {
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
