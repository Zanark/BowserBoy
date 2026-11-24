import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GAME_SLOTS, gameSlot, validateLibraryEntry, validateLibrarySelection } from '../../src/game-library-catalog.js';
import { localLibraryResponse } from '../../scripts/local-library.mjs';
import { siteFiles, siteSource } from '../../scripts/site-files.mjs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createDemoRom } from '../../scripts/demo-rom.mjs';

const entry = (system = 'gba') => ({
  title: 'Local original demo', gameId: 'a'.repeat(64),
  name: system === 'gba' ? 'demo.gba' : 'demo.nds',
  file: new Blob([new Uint8Array(512)]), cover: null,
});

test('real loopback server exposes slot files only with the explicit library flag', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bowser-library-http-'));
  const folder = join(root, '.local', 'game-library', 'gba', 'slot-3');
  const script = join(process.cwd(), 'scripts', 'serve.mjs');
  let server;
  const start = async library => {
    server = spawn(process.execPath, [script, '--port', '5196', ...(library ? ['--library'] : [])],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    await Promise.race([
      once(server.stdout, 'data'),
      once(server, 'exit').then(([code]) => { throw new Error(`Library test server exited (${code}).`); }),
      once(server, 'error').then(([error]) => { throw error; }),
    ]);
  };
  const stop = async () => {
    if (server && server.exitCode === null) {
      const exit = once(server, 'exit');
      server.kill();
      await exit;
    }
    server = null;
  };
  try {
    await mkdir(folder, { recursive: true });
    for (const name of ['src', 'assets', join('web', 'library')]) await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, 'web', 'library', 'manifest.json'), '{"version":1,"slots":[]}');
    const bytes = createDemoRom();
    for (const [name, data] of [['game.gba', bytes], ['title.txt', 'Original HTTP fixture']]) {
      const path = join(folder, name);
      await writeFile(path, data, { flag: 'wx' });
    }
    await start(false);
    let response = await fetch('http://127.0.0.1:5196/library/manifest.json');
    assert.deepEqual(await response.json(), { version: 1, slots: [] });
    assert.equal((await fetch('http://127.0.0.1:5196/library/gba/slot-3/game.gba')).status, 404);
    await stop();
    await start(true);
    response = await fetch('http://127.0.0.1:5196/library/manifest.json');
    const manifest = await response.json();
    assert.deepEqual(manifest.slots.find(slot => slot.id === 'gba-3'),
      { id: 'gba-3', rom: true, cover: false, title: 'Original HTTP fixture' });
    response = await fetch('http://127.0.0.1:5196/library/gba/slot-3/game.gba');
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(bytes));
    assert.equal((await fetch('http://127.0.0.1:5196/library/gba/slot-3/title.txt')).status, 404);
    assert.equal((await fetch('http://127.0.0.1:5196/.local/game-library/gba/slot-3/game.gba')).status, 404);
  } finally {
    await stop();
    await rm(root, { recursive: true });
  }
});

test('slot persistence rejects cross-console files and malformed selections', () => {
  assert.throws(() => gameSlot('ds-4'), /Unknown/);
  assert.equal(validateLibraryEntry('gba-1', entry()).title, 'Local original demo');
  assert.throws(() => validateLibraryEntry('ds-1', entry()), /invalid/);
  assert.throws(() => validateLibraryEntry('ds-1', { ...entry('ds'), file: new Blob([new Uint8Array(192)]) }), /invalid/);
  assert.throws(() => validateLibraryEntry('gba-1', { ...entry(), gameId: 'missing' }), /invalid/);
  assert.throws(() => validateLibraryEntry('gba-1', { ...entry(), cover: new Blob(['<script>'], { type: 'image/svg+xml' }) }), /invalid/);
  assert.deepEqual(validateLibrarySelection({ version: 1, gba: 'gba-3', ds: 'ds-2' }), { version: 1, gba: 'gba-3', ds: 'ds-2' });
  assert.throws(() => validateLibrarySelection({ version: 1, gba: 'ds-1', ds: null }), /invalid/);
});

test('opt-in local routes enumerate only named slot inputs; public manifest stays empty', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bowser-library-'));
  try {
    const folder = join(root, 'gba', 'slot-1');
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'game.gba'), Buffer.alloc(512, 5));
    await writeFile(join(folder, 'title.txt'), 'A little escape');
    await writeFile(join(folder, 'private.txt'), 'not a served input');
    const manifest = JSON.parse((await localLibraryResponse('library/manifest.json', root)).data);
    assert.deepEqual(manifest.slots, [{ id: 'gba-1', rom: true, cover: false, title: 'A little escape' }]);
    const rom = await localLibraryResponse('library/gba/slot-1/game.gba', root);
    assert.equal(rom.status, 200);
    assert.equal(rom.data.length, 512);
    assert.equal((await localLibraryResponse('library/ds/slot-3/game.nds', root)).status, 404);
    for (const path of ['library/gba/slot-1/private.txt', 'library/gba/slot-1/title.txt', 'library/gba/slot-4/game.gba',
      'library/../gba/slot-1/game.gba', '.local/game-library/gba/slot-1/game.gba']) {
      assert.equal(await localLibraryResponse(path, root), null);
    }
    await writeFile(join(folder, 'title.txt'), 'x'.repeat(101));
    await assert.rejects(localLibraryResponse('library/manifest.json', root), /1-100/);
    const files = await siteFiles();
    assert.ok(files.every(path => !path.includes('.local')));
    const publicManifest = JSON.parse(await readFile(siteSource(join('library', 'manifest.json')), 'utf8'));
    assert.deepEqual(publicManifest, { version: 1, slots: [] });
    for (const slot of GAME_SLOTS) assert.ok(!files.includes(slot.romPath));
  } finally { await rm(root, { recursive: true }); }
});
