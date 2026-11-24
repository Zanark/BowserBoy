import { test, expect } from '@playwright/test';
import { createDemoRom } from '../../scripts/demo-rom.mjs';
import { createDsDemoRom } from '../../scripts/demo-ds-rom.mjs';
import { waitForDesk } from './pixel-lab.mjs';

async function ready(page) {
  await page.goto('./');
  await waitForDesk(page);
  await expect(page.locator('#game-library-open')).toBeEnabled({ timeout: 90000 });
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
}

const romFile = (system, number) => {
  const bytes = Buffer.from(system === 'gba' ? createDemoRom() : createDsDemoRom());
  bytes[bytes.length - 1] ^= number;
  return { name: `${system === 'gba' ? 'Pixel' : 'Twin'} Lab ${number}.${system === 'gba' ? 'gba' : 'nds'}`,
    mimeType: 'application/octet-stream', buffer: bytes };
};

async function attach(page, system, number) {
  if (!await page.locator('#game-library').isVisible()) await page.locator('#game-library-open').click();
  await expect(page.locator('#game-library')).toBeVisible();
  await page.locator(`[data-slot="${system}-${number}"] .game-library-rom`).setInputFiles(romFile(system, number));
  await expect(page.locator(`[data-slot="${system}-${number}"] .game-library-state`)).toContainText('BROWSER-LOCAL');
}

const finished = page => expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'idle', { timeout: 90000 });

test('six spine-out boxes render; physical click opens a real case and missing ROM stays honest', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  const state = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    return {
      boxes: [...view.gameShelves.boxes].map(([id, box]) => ({
        id, spine: box.spine.name, position: box.root.position.toArray(),
        quaternion: box.root.quaternion.toArray(),
        ndc: box.spine.getWorldPosition(new Vector3()).project(view.camera).toArray(),
        picked: (() => {
          const point = view.project(box.spine);
          const rect = view.canvas.getBoundingClientRect();
          const hit = view.pick({ clientX: rect.left + point.x, clientY: rect.top + point.y })?.object;
          return hit === box.spine ? box.slot.id : hit?.name;
        })(),
      })),
      old: ['DAYDREAM', 'LITTLE WORLDS'].some(title => view.scene.getObjectByName(title)),
      deskCards: view.gameShelves.lastCards.size,
    };
  });
  expect(state.boxes).toHaveLength(6);
  expect(state.deskCards).toBe(0);
  for (const box of state.boxes) {
    expect(box.picked).toBe(box.id);
    expect(Math.abs(box.ndc[0])).toBeLessThan(.95);
    expect(Math.abs(box.ndc[1])).toBeLessThan(.95);
  }
  await page.screenshot({ path: testInfo.outputPath('six-game-boxes-desktop.png') });
  const point = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const box = view.gameShelves.boxes.get('ds-3');
    return view.project(box.spine);
  });
  await page.locator('#scene-canvas').click({ position: point });
  await expect(page.locator('#scene')).toHaveAttribute('data-game-box', 'ds-3');
  await expect(page.locator('#notice')).toContainText('empty model');
  await expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'cover', { timeout: 30000 });
  await page.screenshot({ path: testInfo.outputPath('ds-case-presented-cover.png') });
  await expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'extracting', { timeout: 30000 });
  await page.screenshot({ path: testInfo.outputPath('ds-case-open-card-extracting.png') });
  await finished(page);
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.gameShelves.lastCards.size)).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#game-library-open')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('six-game-boxes-mobile.png') });
  await page.locator('#game-library-open').click();
  await expect(page.locator('#game-library .game-library-slot')).toHaveCount(6);
  expect(await page.locator('#game-library').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('shelf motion uses presented frames, blocks controls and honors reduced motion', async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => { (await import('./src/app.js')).view.gameShelves.preview('ds-1', { dummy: true }); });
  await expect(page.locator('#hardware-power')).toBeDisabled();
  await expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'opening', { timeout: 30000 });
  const elapsed = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.nativeBusy = true;
    return view.gameShelves.motion.elapsed;
  });
  await page.waitForTimeout(350);
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.gameShelves.motion.elapsed)).toBe(elapsed);
  await page.evaluate(async () => { (await import('./src/app.js')).view.nativeBusy = false; });
  await finished(page);
  await expect(page.locator('#hardware-power')).toBeEnabled();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async () => (await import('./src/app.js')).view.gameShelves.preview('gba-2', { dummy: true }));
  await finished(page);
  expect(await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const box = view.gameShelves.boxes.get('gba-2');
    return box.root.position.equals(box.home.position) && box.hinge.rotation.x === 0 && box.cartridge.visible;
  })).toBe(true);
});

test('local ROM, original cover and title persist; invalid ROM does not replace a cached slot', async ({ page }) => {
  await ready(page);
  await attach(page, 'gba', 1);
  const row = page.locator('[data-slot="gba-1"]');
  await row.locator('.game-library-title').fill('My first little escape');
  await row.locator('.game-library-title').press('Tab');
  await expect(page.locator('#game-library-status')).toContainText('title updated');
  const cover = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 60;
    const context = canvas.getContext('2d'); context.fillStyle = '#6ea58c'; context.fillRect(0, 0, 40, 60);
    return canvas.toDataURL().split(',')[1];
  });
  await row.locator('.game-library-cover').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from(cover, 'base64') });
  await expect(page.locator('#game-library-status')).toContainText('cover updated');
  await row.locator('.game-library-rom').setInputFiles({ name: 'bad.gba', mimeType: 'application/octet-stream', buffer: Buffer.alloc(512) });
  await expect(page.locator('#game-library-status')).toContainText('does not have a GBA');
  await page.reload();
  await waitForDesk(page);
  await expect(page.locator('#game-library-open')).toBeEnabled({ timeout: 90000 });
  await page.locator('#game-library-open').click();
  await expect(row.locator('.game-library-title')).toHaveValue('My first little escape');
  await expect(row.locator('.game-library-state')).toContainText('Pixel Lab 1.gba');
  const retained = await page.evaluate(async () => {
    const { library } = await import('./src/app.js');
    return { cover: library.entries.get('gba-1').cover.type, games: library.entries.size };
  });
  expect(retained).toEqual({ cover: 'image/png', games: 1 });
});

test('actual original GBA and DS runtimes replay A-B-A, shortcut current game and preload both on reload', async ({ page }) => {
  test.setTimeout(600000);
  await ready(page);
  await page.evaluate(async () => {
    const { library, view } = await import('./src/app.js');
    const load = library.hooks.load;
    window.shelfLoadPoses = [];
    library.hooks.load = (...args) => {
      window.shelfLoadPoses.push({ phase: view.host.dataset.gameBoxPhase,
        elapsed: view.gameShelves.motion?.elapsed ?? 4900 });
      return load(...args);
    };
  });
  for (const system of ['gba', 'ds']) {
    await attach(page, system, 1);
    await attach(page, system, 2);
    for (const number of [1, 2, 1]) {
      if (!await page.locator('#game-library').isVisible()) await page.locator('#game-library-open').click();
      await expect(page.locator('#game-library')).toBeVisible();
      await page.locator(`[data-slot="${system}-${number}"] .game-library-play`).click();
      await expect(page.locator('#scene')).toHaveAttribute('data-game-box', `${system}-${number}`, { timeout: 30000 });
      await finished(page);
      await expect.poll(async () => page.evaluate(async ({ system, number }) => {
        const { library } = await import('./src/app.js');
        return library.selection[system] === `${system}-${number}`;
      }, { system, number }), { timeout: 90000 }).toBe(true);
      const loadPose = await page.evaluate(() => window.shelfLoadPoses.at(-1));
      expect(loadPose.elapsed).toBeGreaterThanOrEqual(4250);
      expect(['returning', 'idle']).toContain(loadPose.phase);
      const mount = system === 'gba' ? '#runtime-mount' : '#ds-runtime-mount';
      await expect(page.locator(`${mount} iframe`)).toBeAttached();
    }
    const before = await page.evaluate(async system => {
      const { library, view } = await import('./src/app.js');
      return { id: library.hooks.current(system), card: view.gameShelves.lastCards.get(system).uuid };
    }, system);
    await page.locator('#game-library-open').click();
    await page.locator(`[data-slot="${system}-1"] .game-library-play`).click();
    await expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'idle');
    const after = await page.evaluate(async system => {
      const { library, view } = await import('./src/app.js');
      return { id: library.hooks.current(system), card: view.gameShelves.lastCards.get(system).uuid };
    }, system);
    expect(after).toEqual(before);
    await page.locator('#put-down').click();
    await expect.poll(async () => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      return view.mode === 'table' && !view.transition;
    })).toBe(true);
    const cardPoint = await page.evaluate(async system => {
      const { view } = await import('./src/app.js');
      return view.project(view.gameShelves.lastCards.get(system));
    }, system);
    await page.locator('#scene-canvas').click({ position: cardPoint });
    await expect.poll(async () => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      return view.mode === 'playing' && !view.transition;
    })).toBe(true);
    await finished(page);
    expect(await page.evaluate(async system => (await import('./src/app.js')).view.gameShelves.lastCards.get(system).uuid, system)).toBe(before.card);
    if (system === 'gba') {
      await page.evaluate(() => document.getElementById('autosave-toggle').click());
      await expect(page.locator('#autosave-toggle')).toHaveAttribute('aria-pressed', 'false');
      await page.locator('#game-library-open').click();
      page.once('dialog', dialog => dialog.dismiss());
      await page.locator('[data-slot="gba-2"] .game-library-play').click();
      await expect.poll(async () => page.evaluate(async () => {
        const { library } = await import('./src/app.js');
        return !library.busy && !library.hooks.isBusy();
      })).toBe(true);
      await finished(page);
      expect(await page.evaluate(async () => {
        const { library, view } = await import('./src/app.js');
        return { selected: library.selection.gba, id: library.hooks.current('gba'),
          card: view.gameShelves.lastCards.get('gba').uuid };
      })).toEqual({ selected: 'gba-1', id: before.id, card: before.card });
      await page.evaluate(() => document.getElementById('autosave-toggle').click());
      await expect(page.locator('#autosave-toggle')).toHaveAttribute('aria-pressed', 'true');
    }
  }
  await page.reload();
  await waitForDesk(page);
  await expect(page.locator('#game-library-open')).toBeEnabled({ timeout: 120000 });
  const restored = await page.evaluate(async () => {
    const { library, view } = await import('./src/app.js');
    return { selection: library.selection, cards: [...view.gameShelves.lastCards.keys()],
      motion: !!view.gameShelves.motion,
      loaded: ['gba', 'ds'].every(system => library.hooks.current(system) === library.entries.get(`${system}-1`).gameId) };
  });
  expect(restored.selection).toEqual({ version: 1, gba: 'gba-1', ds: 'ds-1' });
  expect(restored.cards.sort()).toEqual(['ds', 'gba']);
  expect(restored.motion).toBe(false);
  expect(restored.loaded).toBe(true);
});

test('local discovery imports original files; discovery failure leaves cached Games usable', async ({ page }) => {
  await ready(page);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 60;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#9e86b7'; ctx.fillRect(0, 0, 40, 60);
    return canvas.toDataURL().split(',')[1];
  });
  await page.route('**/library/manifest.json', route => route.fulfill({ json: {
    version: 1, slots: [{ id: 'gba-3', rom: true, cover: true, title: 'Original local-folder fixture' }],
  } }));
  await page.route('**/library/gba/slot-3/game.gba', route => route.fulfill({
    contentType: 'application/octet-stream', body: Buffer.from(createDemoRom()),
  }));
  await page.route('**/library/gba/slot-3/cover.png', route => route.fulfill({
    contentType: 'image/png', body: Buffer.from(png, 'base64'),
  }));
  await page.reload();
  await waitForDesk(page);
  await expect(page.locator('#game-library-open')).toBeEnabled({ timeout: 90000 });
  await page.locator('#game-library-open').click();
  await expect(page.locator('[data-slot="gba-3"] .game-library-title')).toHaveValue('Original local-folder fixture');
  expect(await page.evaluate(async () => {
    const entry = (await import('./src/app.js')).library.entries.get('gba-3');
    return { name: entry.name, cover: entry.cover.type };
  })).toEqual({ name: 'game.gba', cover: 'image/png' });
  await page.route('**/library/manifest.json', route => route.fulfill({ json: { version: 99, slots: [] } }));
  await page.reload();
  await waitForDesk(page);
  await expect(page.locator('#notice')).toContainText('Game shelves could not restore');
  await expect(page.locator('#game-library-open')).toBeEnabled();
  await page.locator('#game-library-open').click();
  await expect(page.locator('[data-slot="gba-3"] .game-library-title')).toHaveValue('Original local-folder fixture');
  await page.route('**/library/manifest.json', () => {});
  await page.reload();
  await waitForDesk(page);
  await expect(page.locator('#notice')).toContainText('Game shelves could not restore', { timeout: 20000 });
  await expect(page.locator('#game-library-open')).toBeEnabled();
  await page.locator('#game-library-open').click();
  await expect(page.locator('[data-slot="gba-3"] .game-library-title')).toHaveValue('Original local-folder fixture');
});
