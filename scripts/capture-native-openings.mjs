// Capture-only interception: shipping player.js is never changed. Recording begins
// at entry to EJS_onGameStart, after core/cartridge loading, before host readiness.
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('Usage: capture-native-openings.mjs <private-output>');
await mkdir(output, { recursive: true });
const baseURL = process.env.BBA_CAPTURE_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
try {
  for (const [system, seconds, trim, rom] of [
    ['gba', 30, 2.5, process.env.BBA_CAPTURE_ROM],
    ['ds', 90, 8, process.env.BBA_CAPTURE_DS_ROM],
  ]) {
    console.log(`Acquiring ${system}: fresh context, no game inputs`);
    if (!rom) throw new Error(`Missing ${system} ROM environment variable.`);
    const context = await browser.newContext({ viewport: { width: 1100, height: 850 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    let intercepted = 0;
    await context.route('**/src/player.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const marker = 'EJS_onGameStart: async () => {';
      if (!source.includes(marker)) throw new Error('Native start hook not found.');
      intercepted++;
      console.log(`${system}: native callback capture hook installed`);
      const hook = `
        window.__opening = { boundary: 'EJS_onGameStart entry', startedAt: performance.now(),
          wallStartedAt: new Date().toISOString(), inputEvents: [], seconds: ${seconds} };
        const openingCanvas = window.EJS_emulator.canvas;
        const openingStream = openingCanvas.captureStream(30);
        const openingRecorder = new MediaRecorder(openingStream, {
          mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 4000000
        });
        const openingChunks = [];
        window.__opening.done = new Promise((resolve, reject) => {
          openingRecorder.ondataavailable = event => { if (event.data.size) openingChunks.push(event.data); };
          openingRecorder.onerror = event => reject(new Error(event.error?.message || 'Native recorder error'));
          openingRecorder.onstop = async () => {
            window.__opening.stoppedAt = performance.now();
            window.__opening.width = openingCanvas.width;
            window.__opening.height = openingCanvas.height;
            const blob = new Blob(openingChunks, { type: openingRecorder.mimeType });
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let binary = '';
            for (let i = 0; i < bytes.length; i += 32768)
              binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
            window.__opening.base64 = btoa(binary);
            openingStream.getTracks().forEach(track => track.stop());
            resolve();
          };
        });
        window.addEventListener('message', event => {
          if (['bba:input', 'bba:touch'].includes(event.data?.type))
            window.__opening.inputEvents.push({ type: event.data.type, pressed: event.data.pressed ?? event.data.value?.pressed });
        });
        openingRecorder.start(1000);
        setTimeout(() => openingRecorder.stop(), ${seconds * 1000});
      `;
      await route.fulfill({ response, body: source.replace(marker, marker + hook) });
    });
    let receipt;
    try {
      await page.goto(baseURL);
      console.log(`${system}: page loaded`);
      await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
      await page.locator('#scene-loading').waitFor({ state: 'hidden', timeout: 90000 });
      if (system === 'gba') {
        const point = await page.evaluate(async () => {
          const { view } = await import('./src/app.js');
          return view.project(view.model.screen);
        });
        await page.mouse.click(point.x, point.y);
        await page.locator('#hardware-power').click();
        await expect(page.locator('#scene')).not.toHaveAttribute('data-booting', 'true', { timeout: 30000 });
        await page.locator('#tools-open').click();
        await page.locator('#rom-file').setInputFiles(rom);
      } else {
        await page.locator('#select-ds').click();
        await page.locator('#ds-open').click();
        await page.locator('#ds-rom-file').setInputFiles(rom);
      }
      console.log(`${system}: ROM selected; waiting for actual core start`);
      await expect.poll(() => page.frames().some(frame => frame.url().endsWith('player.html')), { timeout: 90000 }).toBe(true);
      const frame = page.frames().find(frame => frame.url().endsWith('player.html'));
      await frame.waitForFunction(() => window.__opening, null, { timeout: 180000 });
      console.log(`${system}: actual core started, recording native canvas`);
      let watchdog;
      try {
        await Promise.race([
          frame.evaluate(() => window.__opening.done),
          new Promise((_, reject) => {
            watchdog = setTimeout(() => reject(new Error(`${system} native recorder did not stop on time`)), (seconds + 20) * 1000);
          }),
        ]);
      } finally { clearTimeout(watchdog); }
      const result = await frame.evaluate(() => {
        const { done, ...result } = window.__opening;
        return result;
      });
      const { base64, ...timing } = result;
      const video = resolve(output, `${system}-native.webm`);
      await writeFile(video, Buffer.from(base64, 'base64'));
      if (errors.length || intercepted !== 1 || timing.inputEvents.some(event => event.pressed))
        throw new Error(`Native acquisition invalid: ${JSON.stringify({ errors, intercepted, timing })}`);
      receipt = { system, baseURL, rom, romSha256: createHash('sha256').update(await readFile(rom)).digest('hex'),
        video, trim, duration: seconds - trim, timing, errors, intercepted,
        note: 'Fresh isolated context, no restore and no game input. Native retained WebGL canvas MediaRecorder; not a 3D scene recording.' };
      console.log(`Captured ${system}: ${timing.width}x${timing.height}, ${(timing.stoppedAt - timing.startedAt) / 1000}s`);
    } catch (error) {
      errors.push(error.message);
      await page.screenshot({ path: resolve(output, `${system}-native-failure.png`) });
      throw error;
    } finally {
      await writeFile(resolve(output, `${system}-native.json`), JSON.stringify(receipt ?? { errors, failed: true }, null, 2));
      await context.close();
    }
  }
} finally { await browser.close(); }
