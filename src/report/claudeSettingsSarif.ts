import type { ClaudeSettingsAudit } from '../analyzers/claudeSettings.js';
import type { Finding, Severity } from '../types.js';

export interface ClaudeSettingsSarifLog {
  $schema: string;
  version: '2.1.0';
  runs: ClaudeSettingsSarifRun[];
}

interface ClaudeSettingsSarifRun {
  tool: {
    driver: {
      name: string;
      informationUri: string;
      rules: ClaudeSettingsSarifRule[];
    };
  };
  results: ClaudeSettingsSarifResult[];
}

interface ClaudeSettingsSarifRule {
  id: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  defaultConfiguration: { level: ClaudeSettingsSarifLevel };
}

interface ClaudeSettingsSarifResult {
  ruleId: string;
  level: ClaudeSettingsSarifLevel;
  message: { text: string };
  locations: ClaudeSettingsSarifLocation[];
}

interface ClaudeSettingsSarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number };
  };
  message: { text: string };
}

type ClaudeSettingsSarifLevel = 'error' | 'warning' | 'note';

export function createClaudeSettingsSarif(audit: ClaudeSettingsAudit): ClaudeSettingsSarifLog {
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ContextForge Claude Settings',
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
                artifactLocation: { uri: finding.file ?? '.claude/settings.json' },
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

function rulesFromFindings(findings: Finding[]): ClaudeSettingsSarifRule[] {
  const rules = new Map<string, ClaudeSettingsSarifRule>();
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
  return `claude-settings/${type}`;
}

function sarifLevel(severity: Severity): ClaudeSettingsSarifLevel {
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
