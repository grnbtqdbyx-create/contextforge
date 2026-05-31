import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('use-case documentation', () => {
  it('provides a practical maintainer use-case guide', async () => {
    const guide = await readFile('docs/use-cases.md', 'utf8');

    expect(guide).toContain('# ContextForge Use Cases');
    expect(guide).toContain('## 1. Add an Agent Context Gate to a Repository');
    expect(guide).toContain('contextforge init --all');
    expect(guide).toContain('## 3. Defend Against Malicious Repo Instructions');
    expect(guide).toContain('## 5. Build a Task-Specific Context Pack');
  });

  it('links the use-case guide from public discovery surfaces', async () => {
    const readme = await readFile('README.md', 'utf8');
    const llms = await readFile('llms.txt', 'utf8');
    const full = await readFile('llms-full.txt', 'utf8');

    expect(readme).toContain('[docs/use-cases.md](docs/use-cases.md)');
    expect(llms).toContain('[Use Cases](docs/use-cases.md)');
    expect(full).toContain('docs/use-cases.md');
  });
});
