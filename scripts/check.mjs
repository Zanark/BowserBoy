import { spawnSync } from 'node:child_process';
import { siteFiles, siteSource } from './site-files.mjs';

for (const file of (await siteFiles()).filter((path) => path.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', siteSource(file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Application JavaScript syntax checked.');
