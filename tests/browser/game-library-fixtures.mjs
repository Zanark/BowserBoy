import { expect } from '@playwright/test';
import { createDemoRom } from '../../scripts/demo-rom.mjs';
import { createDsDemoRom } from '../../scripts/demo-ds-rom.mjs';
import { waitForDesk } from './pixel-lab.mjs';

export async function ready(page) {
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

export async function attach(page, system, number) {
  if (!await page.locator('#game-library').isVisible()) await page.locator('#game-library-open').click();
  await expect(page.locator('#game-library')).toBeVisible();
  await page.locator(`[data-slot="${system}-${number}"] .game-library-rom`).setInputFiles(romFile(system, number));
  await expect(page.locator(`[data-slot="${system}-${number}"] .game-library-state`)).toContainText('BROWSER-LOCAL');
}

export const finished = page => expect(page.locator('#scene')).toHaveAttribute('data-game-box-phase', 'idle', { timeout: 90000 });

const idle = page => expect.poll(() => page.evaluate(async () => {
  const { library } = await import('./src/app.js');
  return !library.busy && !library.hooks.isBusy();
})).toBe(true);

export async function playAttached(page, system, number) {
  if (!await page.locator('#game-library').isVisible()) await page.locator('#game-library-open').click();
  await expect(page.locator('#game-library')).toBeVisible();
  await page.locator(`[data-slot="${system}-${number}"] .game-library-play`).click();
  await expect(page.locator('#scene')).toHaveAttribute('data-game-box', `${system}-${number}`, { timeout: 30000 });
  await finished(page);
  await expect.poll(async () => page.evaluate(async ({ system, number }) => {
    const { library } = await import('./src/app.js');
    return library.selection[system] === `${system}-${number}`;
  }, { system, number }), { timeout: 90000 }).toBe(true);
  const mount = system === 'gba' ? '#runtime-mount' : '#ds-runtime-mount';
  await expect(page.locator(`${mount} iframe`)).toBeAttached();
  await finished(page);
  await idle(page);
}

export async function replayLibrary(page, system) {
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
  await attach(page, system, 1);
  await attach(page, system, 2);
  for (const number of [1, 2, 1]) {
    await playAttached(page, system, number);
    const loadPose = await page.evaluate(() => window.shelfLoadPoses.at(-1));
    expect(loadPose.elapsed).toBeGreaterThanOrEqual(4250);
    expect(['returning', 'idle']).toContain(loadPose.phase);
  }
  const before = await page.evaluate(async system => {
    const { library, view } = await import('./src/app.js');
    return { id: library.hooks.current(system), card: view.gameShelves.lastCards.get(system).uuid };
  }, system);
  await page.locator('#game-library-open').click();
  await page.locator(`[data-slot="${system}-1"] .game-library-play`).click();
  await idle(page);
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
  await idle(page);
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
    const confirmation = page.waitForEvent('dialog', { timeout: 90000 });
    await page.locator('[data-slot="gba-2"] .game-library-play').click();
    await (await confirmation).dismiss();
    await finished(page);
    await expect.poll(async () => page.evaluate(async () => {
      const { library } = await import('./src/app.js');
      return !library.busy && !library.hooks.isBusy();
    })).toBe(true);
    expect(await page.evaluate(async () => {
      const { library, view } = await import('./src/app.js');
      return { selected: library.selection.gba, id: library.hooks.current('gba'),
        card: view.gameShelves.lastCards.get('gba').uuid };
    })).toEqual({ selected: 'gba-1', id: before.id, card: before.card });
    await page.evaluate(() => document.getElementById('autosave-toggle').click());
    await expect(page.locator('#autosave-toggle')).toHaveAttribute('aria-pressed', 'true');
  }
}
