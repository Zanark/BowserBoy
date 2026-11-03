import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { createDemoRom } from '../../scripts/demo-rom.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const demoBytes = () => Buffer.from(createDemoRom());
const openTools = async (page) => {
  if (!await page.locator('#tools').isVisible()) await page.locator('#tools-open').click();
};
const closeTools = async (page) => {
  if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
};
const startDemo = async (page) => {
  await openTools(page);
  await page.locator('#demo').click();
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
};
const upload = async (page, name = 'Pixel Lab.gba', bytes = demoBytes()) => {
  await page.locator('#rom-file').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: bytes });
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
};
const canvas = (page) => page.locator('#scene-canvas');
const image = async (page) => {
  const player = page.frames().find((frame) => frame.url().endsWith('player.html'));
  const png = await player.evaluate(async () => [...await window.EJS_emulator.gameManager.screenshot()]);
  return hash(Buffer.from(png));
};
const move = async (page, key = 'ArrowRight', duration = 180) => {
  await closeTools(page);
  await canvas(page).click();
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
};
const readStored = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open('bowser-boy-advance', 1);
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction('games');
    const get = tx.objectStore('games').getAll();
    get.onsuccess = () => resolve(get.result);
    get.onerror = () => reject(get.error);
    tx.oncomplete = () => db.close();
  };
}));

test('static shell, responsive layout, errors, keyboard help and private-file boundaries', async ({ page, request }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Bowser Boy Advance' })).toBeVisible();
  await expect(page.locator('#tools')).not.toBeVisible();
  await expect(page.locator('#screen button')).toHaveCount(0);
  await expect(page.locator('#storage-badge')).toHaveText('LOCAL ONLY');
  await expect(page.locator('#save')).toBeDisabled();
  await page.locator('#rom-file').setInputFiles({ name: 'wrong.zip', mimeType: 'application/zip', buffer: Buffer.alloc(200) });
  await expect(page.locator('#notice')).toContainText('uncompressed .gba');
  await expect(page.locator('#empty-screen')).toBeVisible();
  await openTools(page);
  await page.getByRole('button', { name: 'How it works' }).click();
  await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help')).not.toBeVisible();
  await page.locator('#notice-dismiss').click();
  await closeTools(page);
  await mkdir('docs/images', { recursive: true });
  await page.screenshot({ path: 'docs/images/prototype-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Open cartridge and settings' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/images/prototype-mobile.png', fullPage: true });
  for (const [width, height] of [[1366, 768], [844, 390], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const fits = await page.locator('#player').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.x >= -1 && bounds.y >= -1 && bounds.right <= innerWidth + 1 &&
        bounds.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth;
    });
    expect(fits, `Console fits ${width}x${height}`).toBe(true);
  }
  for (const path of ['.git/config', '.agent-context/STATE.md', 'package.json']) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test('real mGBA renders, responds to input, resumes, isolates ROMs and restores exported progress', async ({ page }) => {
  const errors = [];
  const methods = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => methods.push(request.method()));
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('./');
  await startDemo(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await expect(canvas(page)).toBeVisible();
  const initial = await image(page);
  await move(page);
  const moved = await image(page);
  expect(moved).not.toBe(initial);
  await move(page, 'x', 60);
  await openTools(page);
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Checkpoint saved.');
  const checkpointImage = await image(page);
  const [record] = await readStored(page);
  expect(record.manual.state.byteLength).toBeGreaterThan(1000);
  expect(record.manual.sram?.byteLength).toBeGreaterThan(0);
  expect(record.runtime).toBe('emulatorjs-4.2.3-mgba');
  await move(page, 'ArrowDown');
  expect(await image(page)).not.toBe(checkpointImage);
  await openTools(page);
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Quick-save checkpoint restored.');
  expect(await image(page)).toBe(checkpointImage);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: false }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.rom).toBe(record.id);
  expect(backup.state.length).toBeGreaterThan(1000);
  await move(page, 'ArrowLeft');
  await page.locator('#backup-file').setInputFiles(backupPath);
  await expect(page.locator('#notice')).toContainText('Backup imported and stored');
  expect(await image(page)).toBe(checkpointImage);

  await page.reload();
  await upload(page, 'Renamed cartridge.gba');
  await expect(page.locator('#notice')).toContainText('latest checkpoint has been restored');
  expect(await image(page)).toBe(checkpointImage);
  await expect(page.locator('#game-title')).toHaveText('Renamed cartridge');
  // The actual automatic interval must write without pressing Save.
  const beforeAutomatic = (await readStored(page))[0]?.automatic?.createdAt;
  await move(page, 'ArrowRight', 100);
  await expect.poll(async () => (await readStored(page))[0]?.automatic?.createdAt, { timeout: 20000 }).not.toBe(beforeAutomatic);
  const automaticImage = await image(page);
  const savedRecords = await readStored(page);
  expect(savedRecords[0].automatic).toBeTruthy();

  const second = demoBytes();
  second[second.length - 1] ^= 1;
  await upload(page, 'Other cartridge.gba', second);
  await expect(page.locator('#restore')).toBeDisabled();
  await page.locator('#backup-file').setInputFiles(backupPath);
  await expect(page.locator('#notice')).toContainText('different ROM');
  expect(await image(page)).not.toBe(automaticImage);
  await page.evaluate(() => {
    window.originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Storage quota exceeded', 'QuotaExceededError'); };
  });
  await openTools(page);
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await expect(page.locator('#storage-badge')).toHaveText('SAVE ERROR');
  await expect(page.locator('#notice')).toContainText('could not be stored');
  await expect(page.locator('#autosave-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#restore')).toBeDisabled();
  const emergencyDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: false }).click();
  expect((await emergencyDownload).suggestedFilename()).toMatch(/\.bba-save$/);
  await page.evaluate(() => { IDBObjectStore.prototype.put = window.originalPut; });
  expect(methods.every((method) => ['GET', 'HEAD'].includes(method))).toBe(true);
  expect(errors).toEqual([]);
});

test('IndexedDB transactions retain both slots and reject aborted writes', async ({ page }) => {
  await page.goto('./');
  const result = await page.evaluate(async () => {
    const { SaveStore } = await import('./src/save-store.js');
    const { RUNTIME } = await import('./src/cartridge.js');
    const store = new SaveStore();
    await store.open();
    const game = { id: 'test-storage', title: 'Storage test' };
    const capture = { state: new Uint8Array([1, 2, 3]), sram: null };
    await Promise.all([store.putSlot(game, 'manual', capture), store.putSlot(game, 'automatic', capture)]);
    const saved = await store.get(game.id);
    await store.putBattery(game, new Uint8Array([42]));
    const poweredOff = await store.get(game.id);
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { this.transaction.abort(); };
    let failed = 0;
    try {
      for (const write of [
        () => store.putSlot(game, 'manual', { ...capture, state: new Uint8Array([9]) }),
        () => store.putBattery(game, new Uint8Array([99])),
      ]) {
        try { await write(); }
        catch { failed++; }
      }
    }
    finally { IDBObjectStore.prototype.put = put; }
    const retained = await store.get(game.id);
    return {
      both: !!saved.manual && !!saved.automatic,
      runtime: saved.runtime === RUNTIME,
      failed,
      original: [...retained.manual.state],
      battery: [...retained.battery.sram],
      bootMode: retained.bootMode,
      checkpointMode: saved.bootMode,
      slotsRetained: !!poweredOff.manual && !!poweredOff.automatic,
    };
  });
  expect(result).toEqual({
    both: true, runtime: true, failed: 2, original: [1, 2, 3],
    battery: [42], bootMode: 'battery', checkpointMode: 'checkpoint', slotsRetained: true,
  });
});

test('blocked browser storage is explicit rather than a false save success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('Storage denied', 'SecurityError'); } });
  });
  await page.goto('./');
  await expect(page.locator('#storage-badge')).toHaveText('SAVE ERROR');
  await expect(page.locator('#notice')).toContainText('Progress has not been saved');
  await expect(page.locator('#save')).toBeDisabled();
  await expect(page.locator('#upload')).toBeEnabled();
});

test('unavailable app save storage keeps power-cycle battery data explicitly session-only', async ({ page }) => {
  await page.addInitScript(() => {
    const open = indexedDB.open;
    indexedDB.open = function (name, ...args) {
      if (name === 'bowser-boy-advance') throw new DOMException('Application save storage denied', 'SecurityError');
      return open.call(this, name, ...args);
    };
  });
  await page.goto('./');
  await expect(page.locator('#storage-badge')).toHaveText('SAVE ERROR');
  await startDemo(page);
  await move(page, 'ArrowRight');
  await move(page, 'x', 60);
  const saved = await image(page);
  await page.getByRole('button', { name: 'Turn power off', exact: true }).click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  await expect(page.locator('#notice')).toContainText('this page session only');
  await page.getByRole('button', { name: 'Turn power on', exact: true }).click();
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await expect.poll(() => image(page)).toBe(saved);
});

test('a failed runtime CDN request has a visible retryable error', async ({ page }) => {
  await page.route('https://cdn.emulatorjs.org/**', (route) => route.abort('failed'));
  await page.goto('./');
  await openTools(page);
  await page.locator('#demo').click();
  await expect(page.locator('#notice')).toContainText('CDN could not be reached');
  await expect(page.locator('#loading-screen')).toBeHidden();
  await expect(page.locator('#tools-open')).toBeEnabled();
  await expect(page.locator('#save')).toBeDisabled();
});

test.describe('touch layout', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('physical touch controls operate the core without covering the LCD', async ({ page }) => {
    await page.goto('./');
    await startDemo(page);
    await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
    const player = page.frameLocator('#frame-host iframe');
    const before = await image(page);
    const button = page.getByRole('button', { name: 'D-pad right', exact: true });
    await expect(button).toBeVisible();
    await button.tap();
    await expect.poll(() => image(page)).not.toBe(before);
    await expect(player.locator('.ejs_virtualGamepad_parent')).not.toBeVisible();
    await expect(player.locator('.ejs_virtualGamepad_open')).not.toBeVisible();
    await expect(player.locator('.ejs_menu_bar')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/images/pixel-lab-mobile.png', fullPage: true });
  });
});

test('remapped keyboard and sound preferences persist and physical inputs release correctly', async ({ page }) => {
  await page.goto('./');
  await startDemo(page);
  await page.waitForTimeout(100);
  const original = await image(page);
  await canvas(page).click();
  await page.keyboard.down('z');
  await page.waitForTimeout(100);
  expect(await image(page)).not.toBe(original);
  await page.keyboard.up('z');
  await openTools(page);
  await expect(page.locator('[data-binding="a"]')).toHaveText('Z');
  await expect(page.locator('[data-binding="b"]')).toHaveText('X');
  await page.locator('[data-binding="a"]').click();
  await page.keyboard.press('KeyX');
  await expect(page.locator('#key-status')).toContainText('already assigned');
  await page.keyboard.press('KeyC');
  await expect(page.locator('[data-binding="a"]')).toHaveText('C');
  await page.locator('#volume').press('End');
  await expect(page.locator('#volume')).toBeEnabled();
  await page.locator('#volume').press('ArrowLeft');
  await expect(page.locator('#volume-value')).toHaveText('99%');
  await expect(page.locator('#mute')).toBeEnabled();
  await page.locator('#mute').click();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  const frame = page.frames().find((item) => item.url().endsWith('player.html'));
  expect(await frame.evaluate(() => window.EJS_emulator.volume)).toBe(0);
  await closeTools(page);
  const beforeOldKey = await image(page);
  await move(page, 'z', 80);
  expect(await image(page)).toBe(beforeOldKey);
  await page.keyboard.down('c');
  await page.waitForTimeout(100);
  expect(await image(page)).not.toBe(beforeOldKey);
  await page.keyboard.up('c');
  const right = page.getByRole('button', { name: 'D-pad right', exact: true });
  const box = await right.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(right).toHaveClass(/pressed/);
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(right).not.toHaveClass(/pressed/);
  await page.waitForTimeout(100);
  const released = await image(page);
  await page.waitForTimeout(150);
  expect(await image(page)).toBe(released);
  await page.keyboard.press('Escape');
  await expect(page.locator('#tools')).toBeVisible();
  await page.reload();
  await openTools(page);
  await expect(page.locator('[data-binding="a"]')).toHaveText('C');
  await expect(page.locator('#volume')).toHaveValue('99');
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await upload(page);
  const resumedFrame = page.frames().find((item) => item.url().endsWith('player.html'));
  expect(await resumedFrame.evaluate(() => window.EJS_emulator.volume)).toBe(0);
  await openTools(page);
  await page.locator('#reset-controls').click();
  await expect(page.locator('[data-binding="a"]')).toHaveText('Z');
});

test('blocked preference writes explicitly retain session-only controls and sound', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Preferences denied', 'SecurityError'); };
  });
  await page.goto('./');
  await openTools(page);
  await page.locator('[data-binding="a"]').click();
  await page.keyboard.press('KeyC');
  await expect(page.locator('[data-binding="a"]')).toHaveText('C');
  await expect(page.locator('#preferences-status')).toContainText('this session only');
  await expect(page.locator('#notice')).toContainText('could not be remembered');
});

test('all shell buttons reach the core, mixed input releases safely, and fullscreen retains the console', async ({ page }) => {
  await page.goto('./');
  await startDemo(page);
  const frame = page.frames().find((item) => item.url().endsWith('player.html'));
  await frame.evaluate(() => {
    const manager = window.EJS_emulator.gameManager;
    const simulate = manager.simulateInput.bind(manager);
    window.inputTransitions = [];
    manager.simulateInput = (...args) => {
      window.inputTransitions.push(args);
      return simulate(...args);
    };
  });
  for (const [action, index] of [['up', 4], ['down', 5], ['left', 6], ['right', 7],
    ['a', 8], ['b', 0], ['l', 10], ['r', 11], ['start', 3], ['select', 2]]) {
    await page.locator(`[data-control="${action}"]`).click({ delay: 80 });
    await expect.poll(() => frame.evaluate((button) =>
      window.inputTransitions.some(([, id, value]) => id === button && value === 0), index)).toBe(true);
    expect(await frame.evaluate((button) =>
      window.inputTransitions.some(([, id, value]) => id === button && value === 1), index)).toBe(true);
  }
  await canvas(page).click();
  await frame.evaluate(() => { window.inputTransitions = []; });
  await page.keyboard.down('ArrowRight');
  const right = page.locator('[data-control="right"]');
  await expect(right).toHaveClass(/pressed/);
  await right.click({ delay: 80 });
  await expect(right).toHaveClass(/pressed/);
  await page.keyboard.up('ArrowRight');
  await expect(right).not.toHaveClass(/pressed/);
  expect(await frame.evaluate(() => window.inputTransitions)).toEqual([[0, 7, 1], [0, 7, 0]]);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.locator('#tools')).toBeVisible();
  await expect(right).not.toHaveClass(/pressed/);
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: 'docs/images/cartridge-drawer.png', fullPage: true });
  await page.locator('#fullscreen').click();
  await expect(page.locator('#tools')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('player');
  const fits = await page.locator('#player').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.x >= -1 && bounds.y >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1;
  });
  expect(fits).toBe(true);
  await openTools(page);
  await page.locator('#pause').click();
  expect(await frame.evaluate(() => window.EJS_emulator.paused)).toBe(true);
  await page.locator('#pause').click();
  expect(await frame.evaluate(() => window.EJS_emulator.paused)).toBe(false);
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBe(null);
});

test('power switch destroys the runtime and cold boots only the in-game save, including after reload', async ({ page }) => {
  await page.goto('./');
  await startDemo(page);
  await move(page, 'ArrowRight');
  await move(page, 'x', 60);
  const batteryImage = await image(page);
  const originalFrame = page.frames().find((item) => item.url().endsWith('player.html'));
  const savedX = await originalFrame.evaluate(() => window.EJS_emulator.gameManager.getSaveFile()[0]);
  expect(savedX).toBeGreaterThan(108);
  await move(page, 'ArrowLeft');
  await move(page, 'ArrowDown');
  await openTools(page);
  await page.locator('#save').click();
  await expect(page.locator('#notice')).toContainText('Checkpoint saved.');
  expect(await image(page)).not.toBe(batteryImage);
  const [before] = await readStored(page);
  await closeTools(page);
  await page.getByRole('button', { name: 'Turn power off', exact: true }).click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  expect(originalFrame.isDetached()).toBe(true);
  await expect(page.getByRole('button', { name: 'Turn power on', exact: true })).toBeEnabled();
  await expect(page.locator('[data-control="a"]')).toBeDisabled();
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { source: view.source, texture: view.model.screen.material.map, light: view.model.led.material.emissiveIntensity };
  })).toEqual({ source: null, texture: null, light: 0 });
  const [off] = await readStored(page);
  expect(off.manual).toEqual(before.manual);
  expect(off.battery.sram[0]).toBe(savedX);
  expect(off.bootMode).toBe('battery');

  await page.getByRole('button', { name: 'Turn power on', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Turn power off', exact: true })).toBeEnabled({ timeout: 90000 });
  await expect(page.locator('#notice')).toContainText('not a checkpoint');
  await expect.poll(() => image(page)).toBe(batteryImage);
  const restartedFrame = page.frames().find((item) => item.url().endsWith('player.html'));
  expect(await restartedFrame.evaluate(() => window.EJS_emulator.Module.FS.analyzePath('/game.state').exists)).toBe(false);
  await page.getByRole('button', { name: 'Turn power off', exact: true }).click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  await page.reload();
  await upload(page, 'Renamed cartridge.gba');
  await expect.poll(() => image(page)).toBe(batteryImage);
  expect((await readStored(page))[0].manual).toEqual(before.manual);
});

test('power-off storage failure leaves the live game recoverable instead of discarding its save', async ({ page }) => {
  await page.goto('./');
  await startDemo(page);
  const frame = page.frames().find((item) => item.url().endsWith('player.html'));
  await page.evaluate(() => {
    window.originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Storage quota exceeded', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Turn power off', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Power is still on');
  await expect(page.locator('#frame-host iframe')).toHaveCount(1);
  expect(frame.isDetached()).toBe(false);
  await expect(page.getByRole('button', { name: 'Turn power off', exact: true })).toBeEnabled();
  await openTools(page);
  await expect(page.locator('#export')).toBeEnabled();
  await expect(page.locator('#storage-badge')).toHaveText('SAVE ERROR');
  await page.evaluate(() => { IDBObjectStore.prototype.put = window.originalPut; });
  await closeTools(page);
  await page.getByRole('button', { name: 'Turn power off', exact: true }).click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
});
