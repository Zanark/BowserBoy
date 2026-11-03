import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { createDemoRom } from '../../scripts/demo-rom.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const demoBytes = () => Buffer.from(createDemoRom());
const upload = async (page, name = 'Pixel Lab.gba', bytes = demoBytes()) => {
  await page.locator('#rom-file').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: bytes });
  await expect(page.getByRole('button', { name: 'Pause game', exact: true })).toBeEnabled({ timeout: 90000 });
};
const canvas = (page) => page.frameLocator('#frame-host iframe').locator('canvas.ejs_canvas');
const image = async (page) => {
  const player = page.frames().find((frame) => frame.url().endsWith('player.html'));
  const png = await player.evaluate(async () => [...await window.EJS_emulator.gameManager.screenshot()]);
  return hash(Buffer.from(png));
};
const move = async (page, key = 'ArrowRight', duration = 180) => {
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
  await expect(page.getByRole('heading', { name: 'Press play again.' })).toBeVisible();
  await expect(page.locator('#storage-badge')).toHaveText('LOCAL ONLY');
  await expect(page.locator('#save')).toBeDisabled();
  await page.locator('#rom-file').setInputFiles({ name: 'wrong.zip', mimeType: 'application/zip', buffer: Buffer.alloc(200) });
  await expect(page.locator('#notice')).toContainText('uncompressed .gba');
  await expect(page.locator('#empty-screen')).toBeVisible();
  await page.getByRole('button', { name: 'How it works' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('#notice-dismiss').click();
  await mkdir('docs/images', { recursive: true });
  await page.screenshot({ path: 'docs/images/prototype-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Choose a ROM' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/images/prototype-mobile.png', fullPage: true });
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
  await page.getByRole('button', { name: /Try the original demo/ }).click();
  await expect(page.getByRole('button', { name: 'Pause game', exact: true })).toBeEnabled({ timeout: 90000 });
  await expect(canvas(page)).toBeVisible();
  const initial = await image(page);
  await move(page);
  const moved = await image(page);
  expect(moved).not.toBe(initial);
  await move(page, 'z', 60);
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Checkpoint saved.');
  const checkpointImage = await image(page);
  const [record] = await readStored(page);
  expect(record.manual.state.byteLength).toBeGreaterThan(1000);
  expect(record.manual.sram?.byteLength).toBeGreaterThan(0);
  expect(record.runtime).toBe('emulatorjs-4.2.3-mgba');
  await move(page, 'ArrowDown');
  expect(await image(page)).not.toBe(checkpointImage);
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
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { this.transaction.abort(); };
    let failed = false;
    try { await store.putSlot(game, 'manual', { ...capture, state: new Uint8Array([9]) }); }
    catch { failed = true; }
    finally { IDBObjectStore.prototype.put = put; }
    const retained = await store.get(game.id);
    return {
      both: !!saved.manual && !!saved.automatic,
      runtime: saved.runtime === RUNTIME,
      failed,
      original: [...retained.manual.state],
    };
  });
  expect(result).toEqual({ both: true, runtime: true, failed: true, original: [1, 2, 3] });
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

test('a failed runtime CDN request has a visible retryable error', async ({ page }) => {
  await page.route('https://cdn.emulatorjs.org/**', (route) => route.abort('failed'));
  await page.goto('./');
  await page.locator('#demo').click();
  await expect(page.locator('#notice')).toContainText('CDN could not be reached');
  await expect(page.locator('#loading-screen')).toBeHidden();
  await expect(page.locator('#screen-upload')).toBeEnabled();
  await expect(page.locator('#save')).toBeDisabled();
});

test.describe('touch layout', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('the actual core exposes visible touch controls on a mobile viewport', async ({ page }) => {
    await page.goto('./');
    await page.locator('#demo').click();
    await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
    const player = page.frameLocator('#frame-host iframe');
    const button = player.locator('.ejs_virtualGamepad_parent').getByText('A', { exact: true });
    await expect(button).toBeVisible();
    await button.tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/images/pixel-lab-mobile.png', fullPage: true });
  });
});
