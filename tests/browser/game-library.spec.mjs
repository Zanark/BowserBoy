import { test, expect } from '@playwright/test';
import { createDemoRom } from '../../scripts/demo-rom.mjs';
import { waitForDesk } from './pixel-lab.mjs';
import { ready, attach, finished, playAttached } from './game-library-fixtures.mjs';

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

test('actual original GBA and DS runtimes preload both on reload', async ({ page }) => {
  test.setTimeout(600000);
  await ready(page);
  for (const system of ['gba', 'ds']) {
    await attach(page, system, 1);
    await playAttached(page, system, 1);
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
