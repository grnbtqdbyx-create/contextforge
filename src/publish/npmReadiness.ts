import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type NpmPublishReadinessStatus = 'pass' | 'warn' | 'fail';

export interface NpmPublishReadinessOptions {
  rootDir: string;
}

export interface NpmPublishReadinessCheck {
  name: string;
  status: NpmPublishReadinessStatus;
  detail: string;
}

export interface NpmPublishReadinessResult {
  status: NpmPublishReadinessStatus;
  packageName: string;
  version: string;
  checks: NpmPublishReadinessCheck[];
  nextActions: string[];
}

interface PackageJson {
  name?: string;
  version?: string;
  bin?: Record<string, string> | string;
  publishConfig?: { access?: string };
  packageManager?: string;
  repository?: { type?: string; url?: string } | string;
  homepage?: string;
  bugs?: { url?: string } | string;
}

export async function createNpmPublishReadiness(options: NpmPublishReadinessOptions): Promise<NpmPublishReadinessResult> {
  const packageJson = await readJson<PackageJson>(path.join(options.rootDir, 'package.json'));
  const workflow = await readText(path.join(options.rootDir, '.github', 'workflows', 'npm-publish.yml'));
  const docs = await readText(path.join(options.rootDir, 'docs', 'npm-publish.md'));

  const checks = [
    packageMetadataCheck(packageJson),
    packageProvenanceMetadataCheck(packageJson),
    trustedPublishingWorkflowCheck(workflow),
    preflightCheck(workflow),
    docsCheck(docs),
    humanSetupCheck()
  ];

  return {
    status: overallStatus(checks),
    packageName: packageJson?.name ?? 'unknown',
    version: packageJson?.version ?? 'unknown',
    checks,
    nextActions: nextActions(checks, packageJson?.name ?? 'contextforge')
  };
}

export function formatNpmPublishReadiness(result: NpmPublishReadinessResult): string {
  const lines = [
    `ContextForge npm publish readiness: ${result.status}`,
    `Package: ${result.packageName}@${result.version}`,
    ...result.checks.map((check) => `${check.name}: ${check.status} - ${check.detail}`),
    'Next actions:',
    ...result.nextActions.map((action) => `- ${action}`)
  ];
  return `${lines.join('\n')}\n`;
}

export function createNpmPublishReadinessSummary(result: NpmPublishReadinessResult): string {
  const lines = [
    '# ContextForge npm Publish Readiness',
    '',
    `Status: **${result.status}**`,
    '',
    `Package: \`${result.packageName}@${result.version}\``,
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...result.checks.map((check) => `| ${escapeTableCell(check.name)} | ${check.status} | ${escapeTableCell(check.detail)} |`),
    '',
    '## Next Actions',
    '',
    ...result.nextActions.map((action) => `- ${action}`),
    ''
  ];
  return `${lines.join('\n')}\n`;
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function packageMetadataCheck(pkg: PackageJson | undefined): NpmPublishReadinessCheck {
  const missing: string[] = [];
  if (!pkg?.name) missing.push('name');
  if (!pkg?.version) missing.push('version');
  if (!hasContextForgeBin(pkg)) missing.push('bin.contextforge');
  if (pkg?.publishConfig?.access !== 'public') missing.push('publishConfig.access public');
  if (!pkg?.packageManager?.startsWith('pnpm@')) missing.push('packageManager pnpm');

  return {
    name: 'Package metadata',
    status: missing.length === 0 ? 'pass' : 'fail',
    detail:
      missing.length === 0
        ? `${pkg?.name}@${pkg?.version} is public-package ready with bin dist/cli.js`
        : `missing ${missing.join(', ')}`
  };
}

function packageProvenanceMetadataCheck(pkg: PackageJson | undefined): NpmPublishReadinessCheck {
  const missing: string[] = [];
  if (!hasExpectedRepository(pkg)) missing.push('repository.url grnbtqdbyx-create/contextforge');
  if (pkg?.homepage !== 'https://github.com/grnbtqdbyx-create/contextforge#readme') missing.push('homepage');
  if (!hasExpectedBugsUrl(pkg)) missing.push('bugs.url');

  return {
    name: 'Package provenance metadata',
    status: missing.length === 0 ? 'pass' : 'fail',
    detail:
      missing.length === 0
        ? 'repository, homepage, and issue tracker point at grnbtqdbyx-create/contextforge for npm provenance readers'
        : `missing ${missing.join(', ')}`
  };
}

function trustedPublishingWorkflowCheck(workflow: string): NpmPublishReadinessCheck {
  const missing = requiredFragments(workflow, [
    'workflow_dispatch:',
    'id-token: write',
    'dry_run',
    'default: true',
    'environment: npm-publish',
    'npm publish --access public',
    'if: ${{ inputs.dry_run == false }}'
  ]);
  if (workflow.includes('NPM_TOKEN')) missing.push('remove NPM_TOKEN');

  return {
    name: 'Trusted publishing workflow',
    status: missing.length === 0 ? 'pass' : 'fail',
    detail:
      missing.length === 0
        ? 'npm Trusted Publishing uses GitHub OIDC, manual dispatch, dry-run default, and environment approval'
        : `missing ${missing.join(', ')}`
  };
}

function preflightCheck(workflow: string): NpmPublishReadinessCheck {
  const missing = requiredFragments(workflow, [
    'pnpm typecheck',
    'pnpm test',
    'pnpm build',
    'node dist/cli.js security-benchmark',
    'node dist/cli.js audit --min-context-score 70 --min-cache-score 70 --min-security-score 70',
    'npm pack --dry-run'
  ]);

  return {
    name: 'Publish preflight',
    status: missing.length === 0 ? 'pass' : 'fail',
    detail:
      missing.length === 0
        ? 'typecheck, tests, build, security benchmark, audit, and npm pack dry-run run before publish'
        : `missing ${missing.join(', ')}`
  };
}

function docsCheck(docs: string): NpmPublishReadinessCheck {
  const missing = requiredFragments(docs, ['Trusted Publishing', 'grnbtqdbyx-create/contextforge', 'npm view contextforge name version']);
  return {
    name: 'Publish documentation',
    status: missing.length === 0 ? 'pass' : 'fail',
    detail:
      missing.length === 0
        ? 'docs explain npm package creation, trusted publisher setup, environment approval, and package-name verification'
        : `missing ${missing.join(', ')}`
  };
}

function humanSetupCheck(): NpmPublishReadinessCheck {
  return {
    name: 'Human npm account setup',
    status: 'warn',
    detail: 'npm package ownership, Trusted Publisher settings, and GitHub environment approval must be completed by Ogün Keskin before first publish'
  };
}

function requiredFragments(text: string, fragments: string[]): string[] {
  return fragments.filter((fragment) => !text.includes(fragment));
}

function hasContextForgeBin(pkg: PackageJson | undefined): boolean {
  return typeof pkg?.bin === 'object' && pkg.bin.contextforge === 'dist/cli.js';
}

function hasExpectedRepository(pkg: PackageJson | undefined): boolean {
  return (
    typeof pkg?.repository === 'object' &&
    pkg.repository.type === 'git' &&
    pkg.repository.url === 'git+https://github.com/grnbtqdbyx-create/contextforge.git'
  );
}

function hasExpectedBugsUrl(pkg: PackageJson | undefined): boolean {
  return typeof pkg?.bugs === 'object' && pkg.bugs.url === 'https://github.com/grnbtqdbyx-create/contextforge/issues';
}

function overallStatus(checks: NpmPublishReadinessCheck[]): NpmPublishReadinessStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

function nextActions(checks: NpmPublishReadinessCheck[], packageName: string): string[] {
  const actions: string[] = [];
  if (checks.some((check) => check.status === 'fail')) {
    actions.push('Fix failing local metadata, workflow, or documentation checks before attempting publish.');
  }
  actions.push(`Create or verify the npm package name with \`npm view ${packageName} name version\`.`);
  actions.push('Configure npm Trusted Publishing for grnbtqdbyx-create/contextforge from npmjs.com.');
  actions.push('Keep the GitHub npm-publish environment approval-gated before running dry_run=false.');
  return actions;
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}
