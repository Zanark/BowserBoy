import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Provide an output directory for the original capture and timing receipt.');
await mkdir(output, { recursive: true });
const baseURL = process.env.BBA_CAPTURE_URL || 'https://zanark.github.io/BowserBoyAdvance/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const context = await browser.newContext({
  viewport: { width: 1100, height: 850 },
  recordVideo: { dir: output, size: { width: 1100, height: 850 } },
});
const started = Date.now();
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const clips = {};
const begin = name => { clips[name] = { start: (Date.now() - started) / 1000 }; };
const end = name => { clips[name].duration = (Date.now() - started) / 1000 - clips[name].start; };
const wait = milliseconds => page.waitForTimeout(milliseconds);
const scene = page.locator('#scene');

try {
  await page.goto(baseURL);
  await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await wait(1200);
  begin('pickup-inspect');
  await wait(700);
  const screen = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.project(view.model.screen);
  });
  await page.mouse.click(screen.x, screen.y);
  await expect(scene).toHaveAttribute('data-view', 'playing');
  await wait(1100);
  await page.locator('#inspect').click();
  await expect(scene).toHaveAttribute('data-view', 'inspecting');
  const bounds = await page.locator('#scene-canvas').boundingBox();
  const x = bounds.x + bounds.width / 2 - 170;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 32; step++) {
    await page.mouse.move(x + step * 12, y + Math.sin(step / 8) * 28);
    await wait(45);
  }
  await page.mouse.up();
  await wait(900);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Home');
  await page.locator('#inspect').click();
  await wait(800);
  await page.locator('#put-down').click();
  await expect(scene).toHaveAttribute('data-view', 'table');
  await wait(1100);
  end('pickup-inspect');

  await page.locator('#pickup').click();
  await expect(scene).toHaveAttribute('data-view', 'playing');
  await wait(700);
  begin('power-on');
  await wait(500);
  await page.locator('#hardware-power').click();
  await expect(scene).toHaveAttribute('data-booting', 'true');
  await expect(scene).not.toHaveAttribute('data-booting', 'true', { timeout: 30000 });
  await wait(700);
  end('power-on');

  // Hold the real download only long enough to show the actual insertion path.
  let release;
  const download = new Promise(resolve => { release = resolve; });
  await page.route('https://cdn.emulatorjs.org/4.2.3/data/loader.js', async route => {
    await download;
    await route.continue();
  });
  await page.locator('#tools-open').click();
  begin('cartridge');
  await page.locator('#demo').click();
  try {
    await expect(scene).toHaveAttribute('data-cartridge', 'inserting');
    await expect(scene).toHaveAttribute('data-cartridge', 'seated', { timeout: 30000 });
    await wait(700);
    end('cartridge');
  } finally { release(); }
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
  await wait(1000);
  begin('cozy-lights');
  await wait(700);
  await page.locator('#room-toggle').click();
  await wait(1100);
  await page.locator('#lamp-toggle').click();
  await wait(1100);
  await page.locator('#room-toggle').click();
  await wait(1100);
  await page.locator('#lamp-toggle').click();
  await wait(900);
  end('cozy-lights');
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  const video = await page.video().path();
  await context.close();
  await browser.close();
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({
    baseURL, capturedAt: new Date().toISOString(), video, clips, errors,
    viewport: { width: 1100, height: 850 },
    note: 'Actual browser recording; cartridge download deliberately held during the genuine insertion animation. Original Pixel Lab only.',
  }, null, 2));
}
console.log(`Captured ${Object.keys(clips).length} clips in ${resolve(output, 'capture.json')}`);
