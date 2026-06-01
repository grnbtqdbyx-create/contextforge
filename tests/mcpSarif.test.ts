import { describe, expect, it } from 'vitest';
import { createMcpExposureSarif } from '../src/report/mcpSarif.js';
import type { McpExposureAudit } from '../src/analyzers/mcpExposure.js';

describe('MCP SARIF report', () => {
  it('converts MCP exposure findings to GitHub Code Scanning SARIF', () => {
    const audit: McpExposureAudit = {
      status: 'fail',
      score: 55,
      files: ['.cursor/mcp.json'],
      findings: [
        {
          file: '.cursor/mcp.json',
          type: 'mcp-auto-approval',
          severity: 'high',
          message: '.cursor/mcp.json server "filesystem" enables automatic MCP tool approval through autoApprove.',
          suggestion: 'Require explicit review for MCP tool calls before enabling this server for coding agents.'
        }
      ],
      nextActions: []
    };

    const sarif = createMcpExposureSarif(audit);
    const run = sarif.runs[0];

    expect(sarif.version).toBe('2.1.0');
    expect(run.tool.driver.name).toBe('ContextForge MCP Exposure');
    expect(run.tool.driver.rules.some((rule) => rule.id === 'mcp-exposure/mcp-auto-approval')).toBe(true);
    expect(run.results[0]).toEqual(
      expect.objectContaining({
        ruleId: 'mcp-exposure/mcp-auto-approval',
        level: 'error',
        message: {
          text: '.cursor/mcp.json server "filesystem" enables automatic MCP tool approval through autoApprove.'
        }
      })
    );
    expect(run.results[0].locations[0].physicalLocation.artifactLocation.uri).toBe('.cursor/mcp.json');
  });
});
