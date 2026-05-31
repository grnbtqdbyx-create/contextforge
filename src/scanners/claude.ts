import os from 'node:os';
import path from 'node:path';
import type { ScannerOptions, SessionRecord } from '../types.js';
import { listFiles, readJsonl } from '../utils/files.js';
import { normalizeRecord, selectRecentReadableSessionFiles } from './common.js';

export async function scanClaudeSessions(options: ScannerOptions = {}): Promise<SessionRecord[]> {
  const rootDir = options.demo
    ? path.resolve('fixtures/claude')
    : options.rootDir ?? path.join(os.homedir(), '.claude', 'projects');
  const files = await listFiles(rootDir, (filePath) => filePath.endsWith('.jsonl'));
  const selectedFiles = await selectRecentReadableSessionFiles(files, options);
  const records: SessionRecord[] = [];
  for (const file of selectedFiles) {
    records.push(...(await readJsonl(file)).map((item) => normalizeRecord('claude', file, item)));
  }
  return records;
}
