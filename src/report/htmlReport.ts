import { promises as fs } from 'node:fs';
import type { CacheAudit, ContextFileAudit, ContextSecurityAudit } from '../types.js';
import type { UsageSummary } from '../analyzers/usage.js';
import type { RuleSuggestion } from '../improve/ruleSuggestions.js';

export async function writeHtmlReport(options: {
  outputPath: string;
  usage: UsageSummary;
  context: ContextFileAudit;
  cache: CacheAudit;
  security?: ContextSecurityAudit;
  suggestions: RuleSuggestion[];
}): Promise<void> {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ContextForge Report</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #171717; background: #f7f7f4; }
    main { max-width: 1040px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 40px; margin: 0 0 8px; }
    h2 { margin-top: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .card { background: white; border: 1px solid #deded8; border-radius: 8px; padding: 16px; }
    .metric { font-size: 28px; font-weight: 750; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #deded8; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #ecece7; vertical-align: top; }
    code { background: #ecece7; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>ContextForge Report</h1>
    <p>Local-first token, context, and cache audit for Codex and Claude Code.</p>
    <section class="grid">
      <div class="card"><div>Total tokens</div><div class="metric">${options.usage.totalTokens}</div></div>
      <div class="card"><div>Cached tokens</div><div class="metric">${options.usage.cachedTokens}</div></div>
      <div class="card"><div>Context health</div><div class="metric">${options.context.score}/100</div></div>
      <div class="card"><div>Cache stability</div><div class="metric">${options.cache.score}/100</div></div>
      <div class="card"><div>Context security</div><div class="metric">${options.security?.score ?? 100}/100</div></div>
    </section>
    <h2>Context Findings</h2>
    ${renderFindings(options.context.findings)}
    <h2>Security Findings</h2>
    ${renderFindings(options.security?.findings ?? [])}
    <h2>Cache Findings</h2>
    ${renderFindings(options.cache.findings)}
    <h2>Suggested Improvements</h2>
    <table><tbody>${options.suggestions.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.text)}</td></tr>`).join('')}</tbody></table>
  </main>
</body>
</html>`;
  await fs.writeFile(options.outputPath, html);
}

function renderFindings(findings: Array<{ type: string; severity: string; message: string; suggestion: string }>): string {
  if (findings.length === 0) return '<p>No findings.</p>';
  return `<table><thead><tr><th>Severity</th><th>Type</th><th>Finding</th><th>Suggestion</th></tr></thead><tbody>${findings
    .map((finding) => `<tr><td>${escapeHtml(finding.severity)}</td><td><code>${escapeHtml(finding.type)}</code></td><td>${escapeHtml(finding.message)}</td><td>${escapeHtml(finding.suggestion)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}
