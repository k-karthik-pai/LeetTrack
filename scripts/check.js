import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const directories = ['server', 'public', 'scripts', 'test', 'backend/controllers', 'backend/middleware', 'backend/routes', 'backend/services', 'backend/models', 'integrations/analyzer'];
let count = 0;
for (const directory of directories) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const file = path.join(directory, entry.name);
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) { process.stderr.write(result.stderr); process.exit(1); }
    count++;
  }
}
console.log(`Syntax checked ${count} JavaScript modules.`);
