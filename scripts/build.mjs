import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { siteFiles } from './site-files.mjs';
import { createDemoRom } from './demo-rom.mjs';

await rm('dist', { recursive: true, force: true });
for (const file of await siteFiles()) {
  const target = join('dist', file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(file, target);
}
await writeFile(join('dist', 'assets', 'pixel-lab.gba'), createDemoRom());
await writeFile(join('dist', '.nojekyll'), '');
console.log('Static site built in dist. No ROM collection or private context is included.');
