import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { siteFiles, siteSource } from '../../scripts/site-files.mjs';

test('relocated entry documents keep public URLs and all build sources resolve', async () => {
  const files = await siteFiles();
  for (const name of ['index.html', 'player.html', 'styles.css']) {
    assert.ok(files.includes(name));
    assert.equal(siteSource(name), join('web', name));
  }
  for (const file of files) await access(siteSource(file));
  assert.ok(files.every(file => !/^(?:web|docs|TODO|\.agent-context|demos)[\\/]/.test(file)));
  assert.ok(files.every(file => !file.includes('demos')));
  const html = await readFile(siteSource('index.html'), 'utf8');
  for (const url of ['./styles.css', './src/boot.js', './assets/brand-mark.svg']) {
    assert.ok(html.includes(url), `Missing preserved URL ${url}`);
  }
  assert.ok(files.includes(join('src', 'app.js')), 'The existing app module URL remains public');
  const boot = await readFile(join('src', 'boot.js'), 'utf8');
  assert.ok(boot.includes("import('./app.js')"), 'Startup loads the existing application module');
});
