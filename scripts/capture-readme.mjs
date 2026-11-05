import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const output = process.argv[2];
if (!output) throw new Error('Provide an output directory for the original capture and timing receipt.');
await mkdir(output, { recursive: true });
const baseURL = process.env.BBA_CAPTURE_URL || 'https://zanark.github.io/BowserBoyAdvance/';
const mediaRom = process.env.BBA_CAPTURE_ROM;
const checkoutCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
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
  await page.screenshot({ path: resolve(output, '3d-table.png') });
  begin('pickup-inspect');
  await wait(700);
  const screen = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.project(view.model.screen);
  });
  await page.mouse.click(screen.x, screen.y);
  await expect(scene).toHaveAttribute('data-view', 'playing');
  await wait(1100);
  await page.screenshot({ path: resolve(output, '3d-handheld.png') });
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
  await page.screenshot({ path: resolve(output, '3d-back.png') });
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Home');
  await page.locator('#inspect').click();
  await wait(800);
  await page.locator('#put-down').click();
  await expect(scene).toHaveAttribute('data-view', 'table');
  await wait(1100);
  end('pickup-inspect');

  await page.locator('#pickup').click();
  await page.locator('#inspect').click();
  await expect(scene).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Home');
  for (let step = 0; step < 7; step++) await page.keyboard.press('ArrowUp');
  await wait(800);
  await page.screenshot({ path: resolve(output, 'readme-underside.png') });
  await page.keyboard.press('Home');
  await page.locator('#inspect').click();
  await page.locator('#put-down').click();
  await expect(scene).toHaveAttribute('data-view', 'table');
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
  await expect(page.locator('#notice')).toBeVisible();
  await expect(page.locator('.desk-heading h1')).toBeHidden();
  await page.screenshot({ path: resolve(output, 'readme-notice.png') });

  // Hold the real download only long enough to show the actual insertion path.
  let release;
  const download = new Promise(resolve => { release = resolve; });
  await page.route('https://cdn.emulatorjs.org/4.2.3/data/loader.js', async route => {
    await download;
    await route.continue();
  });
  await page.locator('#tools-open').click();
  begin('cartridge');
  if (mediaRom) await page.locator('#rom-file').setInputFiles(mediaRom);
  else await page.locator('#demo').click();
  try {
    await expect(scene).toHaveAttribute('data-cartridge', 'inserting');
    await expect(scene).toHaveAttribute('data-cartridge', 'seated', { timeout: 30000 });
    await wait(700);
    end('cartridge');
  } finally { release(); }
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
  await wait(mediaRom ? 14000 : 1000);
  if (mediaRom) {
    await page.locator('#scene-canvas').focus();
    await page.keyboard.press('Enter');
    await wait(1800);
  }
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

  if (await page.locator('#notice').isVisible()) await page.locator('#notice button').click();
  await page.locator('#scene-canvas').focus();
  begin('button-feedback');
  await wait(500);
  const presses = [['z'], ['x'], ['ArrowUp', 'ArrowRight']];
  if (!mediaRom) presses.push(['a'], ['s']);
  for (const keys of presses) {
    for (const key of keys) await page.keyboard.down(key);
    await wait(450);
    for (const key of keys) await page.keyboard.up(key);
    await wait(450);
  }
  await wait(500);
  end('button-feedback');

  begin('play-zoom');
  await page.locator('#play-zoom').fill('50');
  await wait(800);
  for (const zoom of ['65', '80', '100', '75', '50']) {
    await page.locator('#play-zoom').fill(zoom);
    await wait(850);
  }
  end('play-zoom');
  await page.locator('#scene-canvas').focus();
  begin('hold-space');
  await wait(900);
  await page.keyboard.down('Space');
  await wait(2000);
  await page.keyboard.up('Space');
  await wait(1300);
  end('hold-space');

  await page.locator('#quick-screen-fullscreen').click();
  await expect(page.locator('#screen-focus')).toBeVisible();
  begin('screen-fullscreen');
  await wait(1000);
  await page.locator('#screen-focus-zoom').fill('70');
  await wait(1200);
  await page.locator('#screen-focus-zoom').fill('100');
  await wait(1200);
  end('screen-fullscreen');
  await page.locator('#screen-focus-close').click();

  // Keep the supplied ROM exclusively in GIF footage, not static settings captures.
  if (mediaRom) {
    await page.locator('#tools-open').click();
    await page.locator('#demo').click();
    await expect(page.locator('#game-title')).toHaveText('Pixel Lab', { timeout: 90000 });
    await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
    await expect(scene).toHaveAttribute('data-cartridge', 'seated', { timeout: 30000 });
    if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
    await wait(1500);
  }
  await page.locator('#quick-controls').click();
  begin('settings-backdrop');
  await wait(1200);
  const drawer = await page.locator('#tools').boundingBox();
  await page.mouse.click(drawer.x / 2, 400);
  await wait(1000);
  end('settings-backdrop');

  await page.mouse.move(10, 10);
  await page.locator('.scene-actions').screenshot({ path: resolve(output, 'readme-dock.png') });
  await page.locator('#tools-open').click();
  await page.locator('#save').click();
  await expect(page.locator('#export')).toBeEnabled();
  await page.locator('.drawer-section[aria-labelledby="progress-heading"]')
    .screenshot({ path: resolve(output, 'readme-saves.png') });
  await page.locator('#shader').scrollIntoViewIfNeeded();
  await page.locator('.drawer-section[aria-labelledby="sound-heading"]')
    .screenshot({ path: resolve(output, 'crt-presets.png') });
  await page.locator('#tools-close').click();
  await page.locator('#quick-screen-fullscreen').click();
  await expect(page.locator('#screen-focus')).toBeVisible();
  await wait(800);
  await page.mouse.move(10, 10);
  await page.screenshot({ path: resolve(output, 'readme-fullscreen.png') });
  await page.locator('#screen-focus-close').click();
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  const video = await page.video().path();
  await context.close();
  await browser.close();
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({
    baseURL, checkoutCommit, capturedAt: new Date().toISOString(), video, clips, errors,
    viewport: { width: 1100, height: 850 },
    showcaseRom: mediaRom ? 'Explicitly selected supplied ROM, GIF footage only; not a test fixture.' : 'Original Pixel Lab.',
    stillsRom: 'Original Pixel Lab or no cartridge.',
    note: 'Actual browser recording; cartridge download deliberately held during genuine insertion. Underside uses Inspect/keyboard tilt; dock/save/shader stills crop real UI. checkoutCommit identifies the local checkout, not independent remote identity. Media capture is not game correctness, audio or performance testing.',
  }, null, 2));
}
console.log(`Captured ${Object.keys(clips).length} clips in ${resolve(output, 'capture.json')}`);
