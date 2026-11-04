import { test, expect } from '@playwright/test';
import { powerOn, demoReady } from './pixel-lab.mjs';

const runtime = page => page.frames().find(frame => frame.url().endsWith('player.html'));
const ready = page => expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });

test('favicon retains the wide handheld silhouette at browser-tab sizes', async ({ page }) => {
  await page.goto('./');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  const samples = await icon.evaluate(async link => {
    const image = new Image();
    image.src = link.href;
    await image.decode();
    return [16, 32, 64].map(size => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      const { data } = context.getImageData(0, 0, size, size);
      let left = size, right = -1, top = size, bottom = -1;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (data[(y * size + x) * 4 + 3] < 128) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      return { size, ratio: (right - left + 1) / (bottom - top + 1),
        transparentCorner: data[3] === 0, image: canvas.toDataURL() };
    });
  });
  for (const sample of samples) {
    expect(sample.transparentCorner).toBe(true);
    expect(sample.ratio).toBeGreaterThan(1.55);
    expect(sample.ratio).toBeLessThan(2.1);
    await test.info().attach(`favicon-${sample.size}`, {
      body: Buffer.from(sample.image.split(',')[1], 'base64'), contentType: 'image/png',
    });
  }
});

test('icon dock fits phone and desktop, exposes named touch controls and opens the requested sections', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#pickup').click();
  for (const [width, height] of [[1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const controls = await page.locator('.scene-actions button:visible').evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect();
      return { label: button.getAttribute('aria-label'), icons: button.querySelectorAll('svg').length,
        width: box.width, height: box.height, left: box.left, right: box.right, bottom: box.bottom };
    }));
    for (const control of controls) {
      expect(control.label).toBeTruthy();
      expect(control.icons).toBe(1);
      expect(control.width).toBeGreaterThanOrEqual(44);
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(width);
      expect(control.bottom).toBeLessThanOrEqual(height);
    }
    if (width <= 390) {
      const dock = await page.locator('.scene-actions').boundingBox();
      expect(dock.height, 'Compact two-row dock, not a trailing orphan icon row').toBeLessThan(100);
    }
    await page.screenshot({ path: test.info().outputPath(`icon-dock-${width}.png`) });
  }
  await page.locator('#quick-controls').click();
  await expect(page.locator('#tools')).toBeVisible();
  await expect(page.locator('[data-binding="up"]')).toBeFocused();
  await expect(page.locator('[data-binding="up"]')).toBeInViewport();
  await page.locator('#tools-close').click();
  await page.locator('#quick-slots').click();
  await expect(page.locator('#checkpoint-slot')).toBeFocused();
  await expect(page.locator('#checkpoint-slot')).toBeInViewport();
  await page.locator('#tools-close').click();
  await page.locator('#quick-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('player');
  await page.evaluate(() => document.exitFullscreen());
});

test('three checkpoint slots stay independent and reject invalid slots without changing legacy saves', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const result = await page.evaluate(async () => {
    const { SaveStore } = await import('./src/save-store.js');
    const { RUNTIME } = await import('./src/cartridge.js');
    const store = new SaveStore();
    await store.open();
    const game = { id: 'slot-fixture', title: 'Slot fixture', runtime: RUNTIME };
    const capture = number => ({ state: new Uint8Array([number]), sram: new Uint8Array([number + 10]) });
    await store.putSlot(game, 'manual', capture(1));
    await store.putSlot(game, 'automatic', capture(4));
    await store.putSlot(game, 'manual2', capture(2));
    await store.putSlot(game, 'manual3', capture(3));
    let error;
    try { await store.putSlot(game, 'manual4', capture(9)); }
    catch (failure) { error = failure.message; }
    const record = await store.get(game.id);
    await store.putBattery(game, new Uint8Array([99]));
    const poweredOff = await store.get(game.id);
    return { slots: ['manual', 'manual2', 'manual3', 'automatic'].map(slot => [...record[slot].state]),
      error, coldBoot: poweredOff.bootMode, retained: [...poweredOff.manual2.state], battery: [...poweredOff.battery.sram] };
  });
  expect(result).toEqual({ slots: [[1], [2], [3], [4]], error: 'Unknown save slot.', coldBoot: 'battery', retained: [2], battery: [99] });
});

test('quick actions reach real core speed, persist autosave off, restore selected slots and perform a safe physical restart', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('./');
  await ready(page);
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  let frame = runtime(page);
  const identity = await frame.evaluate(() => window.runtimeIdentity = crypto.randomUUID());
  await page.locator('#quick-autosave').click();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await frame.evaluate(() => {
    window.speedCalls = [];
    const game = window.EJS_emulator.gameManager;
    for (const name of ['setFastForwardRatio', 'toggleFastForward']) {
      const original = game[name].bind(game);
      game[name] = (...args) => { window.speedCalls.push([name, ...args]); return original(...args); };
    }
  });
  for (const speed of [3, 4, 2, 1]) {
    await page.locator('#quick-speed').click();
    await page.locator(`[data-speed="${speed}"]`).click();
    await expect(page.locator('#quick-speed')).toHaveAccessibleName(`Emulation speed: ${speed}x`);
    expect(await frame.evaluate(() => window.EJS_emulator.isFastForward)).toBe(speed > 1);
    expect(await frame.evaluate(() => window.EJS_emulator.getSettingValue('ff-ratio'))).toBe(`${speed}.0`);
  }
  const calls = await frame.evaluate(() => window.speedCalls);
  for (const speed of [2, 3, 4]) expect(calls).toContainEqual(['setFastForwardRatio', speed]);
  expect(calls).toContainEqual(['toggleFastForward', 0]);
  await page.locator('#quick-slots').click();
  await page.locator('#checkpoint-slot').selectOption('manual2');
  await page.locator('#pause').click();
  await page.locator('#tools-close').click();
  const saved = await frame.evaluate(() => window.EJS_emulator.canvas.toDataURL());
  await page.locator('#quick-save').click();
  await expect(page.locator('#notice')).toContainText('Slot 2');
  await page.locator('#quick-load').click();
  await expect(page.locator('#notice')).toContainText('restored');
  expect(await frame.evaluate(() => window.EJS_emulator.canvas.toDataURL())).toBe(saved);
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBe(identity);
  await page.waitForTimeout(16000);
  const records = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('bowser-boy-advance');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('games');
      const get = tx.objectStore('games').getAll();
      get.onsuccess = () => resolve(get.result.map(record => ({ manual2: !!record.manual2, automatic: !!record.automatic })));
      tx.oncomplete = () => db.close();
    };
  }));
  expect(records).toEqual([{ manual2: true, automatic: false }]);
  await page.locator('#quick-restart').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#scene')).toHaveAttribute('data-booting', 'true');
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  frame = runtime(page);
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBeUndefined();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await ready(page);
  await expect(page.locator('#pause')).toBeEnabled();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#quick-slots').click();
  await page.locator('#checkpoint-slot').selectOption('manual2');
  await expect(page.locator('#restore')).toBeEnabled();
});

test('orbital startup draws supplied image and moving stars, with a stable reduced-motion frame', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const artwork = await page.evaluate(async () => {
    const { drawStartup } = await import('./src/startup.js');
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 160;
    const context = canvas.getContext('2d');
    const images = [], starBounds = [];
    const draw = context.drawImage.bind(context);
    context.drawImage = (image, ...args) => {
      const name = image.src.split('/').pop();
      images.push(name);
      if (name === 'star.png') {
        const [x, y, width, height] = args;
        const transform = context.getTransform();
        starBounds.push(...[[x, y], [x + width, y], [x, y + height], [x + width, y + height]]
          .map(([px, py]) => new DOMPoint(px, py).matrixTransform(transform))
          .map(point => ({ x: point.x, y: point.y })));
      }
      draw(image, ...args);
    };
    drawStartup(canvas, 1200);
    const first = canvas.toDataURL();
    drawStartup(canvas, 1800);
    const moved = canvas.toDataURL() !== first;
    drawStartup(canvas, 0, true);
    const reduced = canvas.toDataURL();
    drawStartup(canvas, 2000, true);
    const stable = canvas.toDataURL() === reduced;
    const renderedImages = [...images];
    const { starImage } = await import('./src/brand.js');
    const sprite = new OffscreenCanvas(starImage.width, starImage.height);
    const spriteContext = sprite.getContext('2d');
    spriteContext.drawImage(starImage, 0, 0);
    const { data } = spriteContext.getImageData(0, 0, sprite.width, sprite.height);
    const padded = Array.from({ length: sprite.width * sprite.height }, (_, pixel) => {
      const x = pixel % sprite.width, y = Math.floor(pixel / sprite.width);
      return (x >= 16 && x < sprite.width - 16 && y >= 16 && y < sprite.height - 16) ||
        data[pixel * 4 + 3] === 0;
    }).every(Boolean);
    for (let elapsed = 0; elapsed <= 3200; elapsed += 100) drawStartup(canvas, elapsed);
    return { images: renderedImages, moved, stable, image: reduced, padded, starBounds };
  });
  expect(artwork.images).toContain('logo.png');
  expect(artwork.images).toContain('orbit.png');
  expect(artwork.images).toContain('glow.png');
  expect(artwork.images.filter(name => name === 'star.png').length).toBe(12);
  expect(artwork.moved).toBe(true);
  expect(artwork.stable).toBe(true);
  expect(artwork.padded).toBe(true);
  expect(artwork.starBounds.every(point => point.x >= 0 && point.x <= 240 && point.y >= 0 && point.y <= 160)).toBe(true);
  await test.info().attach('orbital-startup-raster', { body: Buffer.from(artwork.image.split(',')[1], 'base64'), contentType: 'image/png' });
});
