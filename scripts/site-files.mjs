import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function siteFiles() {
  const files = ['index.html', 'player.html', 'styles.css'];
  for (const directory of ['src', 'assets']) {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      if (file.isFile() && /\.(js|svg)$/.test(file.name)) files.push(join(directory, file.name));
    }
  }
  return files;
}
