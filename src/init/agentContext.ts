import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface AgentContextScaffoldOptions {
  rootDir: string;
  agentsMd?: boolean;
  claudeMd?: boolean;
  copilotInstructions?: boolean;
  projectName?: string;
  force?: boolean;
}

export interface AgentContextScaffoldResult {
  path: string;
  kind: 'agents-md' | 'claude-md' | 'copilot-instructions';
  created: boolean;
}

export async function scaffoldAgentContextFiles(options: AgentContextScaffoldOptions): Promise<AgentContextScaffoldResult[]> {
  const projectName = options.projectName?.trim() || path.basename(options.rootDir);
  const targets: Array<{ kind: AgentContextScaffoldResult['kind']; fileName: string; content: string }> = [];
  if (options.agentsMd) targets.push({ kind: 'agents-md', fileName: 'AGENTS.md', content: agentsMd(projectName) });
  if (options.claudeMd) targets.push({ kind: 'claude-md', fileName: 'CLAUDE.md', content: claudeMd(projectName) });
  if (options.copilotInstructions) {
    targets.push({
      kind: 'copilot-instructions',
      fileName: path.join('.github', 'copilot-instructions.md'),
      content: copilotInstructions(projectName)
    });
  }

  const results: AgentContextScaffoldResult[] = [];
  for (const target of targets) {
    const filePath = path.join(options.rootDir, target.fileName);
    if (!options.force && (await fileExists(filePath))) {
      results.push({ path: filePath, kind: target.kind, created: false });
      continue;
    }

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, target.content);
    results.push({ path: filePath, kind: target.kind, created: true });
  }
  return results;
}

function agentsMd(projectName: string): string {
  return `# ${projectName} Agent Guide

Keep this file short, concrete, and repository-specific. Remove anything that does not help an agent complete real tasks in this repo.

## Project Map

- Describe the main app, package, or service entry points here.
- Point agents to the smallest useful docs before broad exploration.

## Build and test

\`\`\`bash
pnpm install
pnpm test
pnpm build
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md
\`\`\`

## Working Rules

- Read the relevant source and tests before editing.
- Keep changes scoped to the requested task.
- Run the narrowest useful test first, then the broader suite when behavior changes.
- Do not add broad rules, motivational text, or stale project history to this file.
`;
}

function claudeMd(projectName: string): string {
  return `# ${projectName} Claude Memory

Use this as shared project memory for Claude Code. Keep it concise; long memory files spread attention and increase token cost.

## Project commands

\`\`\`bash
pnpm test
pnpm build
contextforge plan --output contextforge-agent-plan.md
\`\`\`

## Project-specific guidance

- Add only conventions that are true for this repository.
- Prefer file paths, commands, and concrete invariants over general advice.
- Do not add broad rules, secrets, credentials, or personal preferences.
- Review this file periodically with ContextForge and delete stale guidance.
`;
}

function copilotInstructions(projectName: string): string {
  return `# ${projectName} Copilot Instructions

Keep this file short, concrete, and repository-specific. GitHub Copilot reads this as shared project guidance, so remove generic advice that does not change real work in this repo.

## Project Map

- Describe the main app, package, or service entry points here.
- Link to the smallest useful docs before broad exploration.

## Build and test

\`\`\`bash
pnpm install
pnpm test
pnpm build
contextforge audit --summary contextforge-summary.md --plan contextforge-agent-plan.md
\`\`\`

## Working Rules

- Read relevant source and tests before editing.
- Keep generated code, docs, and CI artifacts aligned when behavior changes.
- Prefer precise file paths, commands, and invariants over broad style advice.
- Do not include secrets, credentials, personal preferences, or stale project history.
`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
