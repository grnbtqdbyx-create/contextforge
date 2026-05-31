import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditContextSecurity } from '../analyzers/contextSecurity.js';

interface SecurityBenchmarkManifest {
  cases: SecurityBenchmarkManifestCase[];
}

interface SecurityBenchmarkManifestCase {
  name: string;
  path: string;
  expected: {
    minScore: number;
    maxScore: number;
    findingTypes: string[];
  };
}

export interface SecurityBenchmarkResult {
  passed: boolean;
  totalCases: number;
  failedCases: number;
  cases: SecurityBenchmarkCaseResult[];
}

export interface SecurityBenchmarkCaseResult {
  name: string;
  rootDir: string;
  passed: boolean;
  expected: {
    minScore: number;
    maxScore: number;
    findingTypes: string[];
  };
  actual: {
    score: number;
    findingTypes: string[];
  };
  failures: string[];
}

export async function runSecurityBenchmark(options: { benchmarkDir?: string } = {}): Promise<SecurityBenchmarkResult> {
  const benchmarkDir = options.benchmarkDir ?? defaultBenchmarkDir();
  const manifestPath = path.join(benchmarkDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as SecurityBenchmarkManifest;
  const cases = await Promise.all(
    manifest.cases.map(async (benchmarkCase) => runBenchmarkCase(benchmarkDir, benchmarkCase))
  );
  const failedCases = cases.filter((benchmarkCase) => !benchmarkCase.passed).length;

  return {
    passed: failedCases === 0,
    totalCases: cases.length,
    failedCases,
    cases
  };
}

async function runBenchmarkCase(
  benchmarkDir: string,
  benchmarkCase: SecurityBenchmarkManifestCase
): Promise<SecurityBenchmarkCaseResult> {
  const rootDir = path.join(benchmarkDir, benchmarkCase.path);
  const audit = await auditContextSecurity({ rootDir });
  const actualFindingTypes = [...new Set(audit.findings.map((finding) => finding.type))].sort();
  const expectedFindingTypes = [...benchmarkCase.expected.findingTypes].sort();
  const failures: string[] = [];

  if (audit.score < benchmarkCase.expected.minScore || audit.score > benchmarkCase.expected.maxScore) {
    failures.push(
      `score ${audit.score} is outside expected range ${benchmarkCase.expected.minScore}-${benchmarkCase.expected.maxScore}`
    );
  }
  if (!sameArray(actualFindingTypes, expectedFindingTypes)) {
    failures.push(
      `finding types ${formatTypes(actualFindingTypes)} did not match expected ${formatTypes(expectedFindingTypes)}`
    );
  }

  return {
    name: benchmarkCase.name,
    rootDir,
    passed: failures.length === 0,
    expected: {
      ...benchmarkCase.expected,
      findingTypes: expectedFindingTypes
    },
    actual: {
      score: audit.score,
      findingTypes: actualFindingTypes
    },
    failures
  };
}

function defaultBenchmarkDir(): string {
  return fileURLToPath(new URL('../../fixtures/security-benchmark', import.meta.url));
}

function sameArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function formatTypes(types: string[]): string {
  return types.length > 0 ? types.join(', ') : 'none';
}
