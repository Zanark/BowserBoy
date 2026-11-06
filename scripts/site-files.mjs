import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const vendor = new Map([
  [join('vendor', 'three.module.js'), join('node_modules', 'three', 'build', 'three.module.js')],
  [join('vendor', 'three.core.js'), join('node_modules', 'three', 'build', 'three.core.js')],
  [join('vendor', 'RectAreaLightUniformsLib.js'), join('node_modules', 'three', 'examples', 'jsm', 'lights', 'RectAreaLightUniformsLib.js')],
  [join('vendor', 'RectAreaLightTexturesLib.js'), join('node_modules', 'three', 'examples', 'jsm', 'lights', 'RectAreaLightTexturesLib.js')],
  [join('vendor', 'THREE-LICENSE.txt'), join('node_modules', 'three', 'LICENSE')],
]);

export function siteSource(file) {
  if (['index.html', 'player.html', 'styles.css'].includes(file)) return join('web', file);
  if (file === join('assets', 'inspection-logo.png')) return join('docs', 'images', 'bowserboyadvanced-logo-glow.png');
  return vendor.get(file) ?? file;
}

export async function siteFiles() {
  const files = ['index.html', 'player.html', 'styles.css', join('assets', 'inspection-logo.png'), ...vendor.keys()];
  for (const directory of ['src', 'assets']) {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      if (file.isFile() && /\.(js|svg|png)$/.test(file.name)) files.push(join(directory, file.name));
    }
  }
  return files;
}
