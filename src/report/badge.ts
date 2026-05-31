import type { AuditResult } from '../audit/buildAudit.js';

export function createBadgeSvg(audit: AuditResult): string {
  const score = Math.round((audit.scores.contextHealth + audit.scores.cacheStability + audit.scores.contextSecurity) / 3);
  const color = statusColor(audit.status);
  const message = `${audit.status} ${score}`;
  const labelWidth = 96;
  const messageWidth = Math.max(58, message.length * 8 + 16);
  const width = labelWidth + messageWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="ContextForge ${message}">
  <title>ContextForge ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".12"/>
    <stop offset="1" stop-opacity=".12"/>
  </linearGradient>
  <mask id="r">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#24292f"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">ContextForge</text>
    <text x="${labelWidth / 2}" y="14">ContextForge</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(message)}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${escapeXml(message)}</text>
  </g>
</svg>
`;
}

function statusColor(status: AuditResult['status']): string {
  if (status === 'pass') return '#2ea043';
  return '#cf222e';
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
