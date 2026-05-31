import { promises as fs } from 'node:fs';
import path from 'node:path';
import { shouldIgnorePath } from '../security/secrets.js';

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonl(filePath: string): Promise<unknown[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as unknown];
      } catch {
        return [];
      }
    });
}

export async function listFiles(rootDir: string, predicate?: (filePath: string) => boolean): Promise<string[]> {
  if (!(await pathExists(rootDir))) return [];
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    if (shouldIgnorePath(current)) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (shouldIgnorePath(fullPath)) continue;
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (!predicate || predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return results.sort();
}

