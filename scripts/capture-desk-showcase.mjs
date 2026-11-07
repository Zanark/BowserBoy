import { chromium, expect as baseExpect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const output = process.argv[2];
const mode = process.argv[3];
if (!output || !['ds', 'lighting'].includes(mode)) throw new Error('Usage: capture-desk-showcase.mjs <private-output> ds|lighting');
if (mode === 'ds' && !process.env.BBA_CAPTURE_DS_ROM) throw new Error('DS capture requires BBA_CAPTURE_DS_ROM.');
await mkdir(output, { recursive: true });
const baseURL = process.env.BBA_CAPTURE_URL || 'https://zanark.github.io/BowserBoy/';
const checkoutCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const viewport = { width: 1100, height: 850 };
const context = await browser.newContext({ viewport, recordVideo: { dir: output, size: viewport } });
const started = Date.now();
const page = await context.newPage();
const scene = page.locator('#scene');
const errors = [], clips = {}, observations = {};
const expect = baseExpect.configure({ timeout: 30000 });
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const wait = milliseconds => page.waitForTimeout(milliseconds);
const screenshot = name => page.screenshot({ path: resolve(output, `${name}.png`) });
async function clip(name, action) {
  clips[name] = { start: (Date.now() - started) / 1000 };
  console.log(`Recording ${name}`);
  await wait(600);
  await action();
  await page.mouse.move(10, 10);
  await wait(900);
  clips[name].duration = (Date.now() - started) / 1000 - clips[name].start;
}
async function toggle(id, enabled) {
  const control = page.locator(`#${id}`);
  if (await control.getAttribute('aria-pressed') !== String(enabled)) await control.click();
}
async function companion(name, action) {
  await page.locator(`#${name}-open`).click();
  await action();
  await page.keyboard.press('Escape');
}
async function point(name) {
  return page.evaluate(async name => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    let target;
    if (name === 'pear') target = view.pear.face.anchor.getWorldPosition(new Vector3());
    else if (name === 'axolotl') target = view.axolotl.head.localToWorld(new Vector3(0, .1, .9));
    else target = (name === 'ds' ? view.ds.screens[1] : view.model.screen).getWorldPosition(new Vector3());
    target.project(view.camera);
    const rect = view.canvas.getBoundingClientRect();
    return { x: rect.x + (target.x + 1) * rect.width / 2, y: rect.y + (1 - target.y) * rect.height / 2 };
  }, name);
}
async function lift(name, height) {
  const p = await point(name);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(p.x + Math.sin(i / 30 * Math.PI) * 40, p.y - height * i / 30);
    await wait(40);
  }
  await wait(1900);
  await page.mouse.wheel(0, -120);
  await wait(900);
  await page.mouse.up();
  await wait(name === 'pear' ? 4500 : 2400);
}
async function dsPixels() {
  return page.evaluate(async () => {
    const ds = (await import('./src/app.js')).view.dsController;
    return ds.outputs.map(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0, nonuniform = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        sum = (sum + pixels[i] * 3 + pixels[i + 1] * 5 + pixels[i + 2] * 7) >>> 0;
        if (pixels[i] !== pixels[0] || pixels[i + 1] !== pixels[1] || pixels[i + 2] !== pixels[2]) nonuniform++;
      }
      return { width: canvas.width, height: canvas.height, sum, nonuniform };
    });
  });
}
async function dsCapture() {
  await page.locator('#select-ds').click();
  await expect(scene).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await clip('ds-cartridge', async () => {
    await page.locator('#ds-rom-file').setInputFiles(process.env.BBA_CAPTURE_DS_ROM);
    await expect(page.locator('#ds-tools')).not.toBeVisible();
    await expect(scene).toHaveAttribute('data-view', 'playing');
    await wait(5000);
    await screenshot('ds-fresh-loading');
  });
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 180000 });
  await wait(20000);
  observations.nativeBefore = await dsPixels();
  expect(observations.nativeBefore.every(screen => screen.width === 256 && screen.height === 192)).toBe(true);
  expect(observations.nativeBefore.some(screen => screen.nonuniform > 100)).toBe(true);
  await clip('ds-gameplay', async () => {
    await wait(6500);
    await screenshot('ds-fresh-playing');
  });
  observations.nativeAfter = await dsPixels();
  expect(observations.nativeAfter).not.toEqual(observations.nativeBefore);
  await page.locator('#scene-canvas').focus();
  for (const key of ['Enter', 'z']) {
    await page.keyboard.press(key);
    await wait(2500);
  }
  await clip('ds-controls', async () => {
    await page.locator('#scene-canvas').focus();
    for (const key of ['Enter', 'z', 'x', 'ArrowRight', 'ArrowDown']) {
      await page.keyboard.down(key);
      await wait(450);
      await page.keyboard.up(key);
      await wait(500);
    }
    const p = await point('ds');
    await page.mouse.move(p.x - 25, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 25, p.y + 10, { steps: 20 });
    await wait(500);
    await page.mouse.up();
  });
  await clip('ds-stylus', async () => {
    await page.locator('#ds-stylus').hover();
    await wait(800);
    await page.locator('#ds-stylus').click();
    await expect(scene).toHaveAttribute('data-ds-stylus', 'held');
    const p = await point('ds');
    await page.mouse.move(p.x - 25, p.y - 10);
    await wait(700);
    await page.mouse.down();
    await page.mouse.move(p.x + 25, p.y + 10, { steps: 24 });
    await wait(500);
    await page.mouse.up();
    await page.mouse.move(p.x + 45, p.y - 20, { steps: 16 });
    await wait(700);
    await page.keyboard.press('Escape');
    await expect(scene).toHaveAttribute('data-ds-stylus', 'docked');
  });
  await clip('ds-play-zoom', async () => {
    for (const value of ['65', '80', '100', '75', '50']) {
      await page.locator('#play-zoom').fill(value);
      await wait(1000);
    }
  });
  await clip('ds-inspect', async () => {
    await page.locator('#inspect').click();
    await expect(scene).toHaveAttribute('data-view', 'inspecting');
    await page.locator('#ds-inspect-action').selectOption('body');
    await page.locator('#scene-canvas').focus();
    for (let i = 0; i < 7; i++) { await page.keyboard.press('ArrowRight'); await wait(120); }
    await page.locator('#ds-hinge').fill('110');
    await wait(1300);
    await screenshot('ds-fresh-inspect');
    await page.locator('#ds-hinge').fill('155');
    await page.locator('#ds-pose-lock').click();
    await page.locator('#inspect').click();
    await expect(scene).toHaveAttribute('data-view', 'playing');
    await wait(1300);
  });
  await page.locator('#inspect').click();
  await expect(scene).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#ds-pose-lock').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Home');
  await page.locator('#ds-hinge').fill('180');
  await page.locator('#inspect').click();
  await expect(scene).toHaveAttribute('data-view', 'playing');
  await clip('ds-lighting', async () => {
    for (const [lamp, room] of [[true, false], [true, true], [false, true], [true, false]]) {
      await toggle('lamp-toggle', lamp);
      await toggle('room-toggle', room);
      await wait(1500);
    }
  });
  await companion('pear', () => toggle('pear-toggle', false));
  await companion('axolotl', () => toggle('axolotl-toggle', false));
  await toggle('lamp-toggle', false);
  await toggle('room-toggle', false);
  await clip('ds-lcd-reflections', async () => {
    await page.locator('#inspect').click();
    await expect(scene).toHaveAttribute('data-view', 'inspecting');
    await page.locator('#scene-canvas').focus();
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowUp']) {
      await page.keyboard.press(key);
      await wait(650);
    }
  });
  observations.nativeFinal = await dsPixels();
}
async function lightingCapture() {
  await screenshot('desk-fresh-table');
  await clip('lighting-overview', async () => {
    await companion('pear', () => toggle('pear-toggle', false));
    await companion('axolotl', () => toggle('axolotl-toggle', false));
    for (const [lamp, room] of [[true, false], [true, true], [false, true], [false, false], [true, false]]) {
      await toggle('lamp-toggle', lamp);
      await toggle('room-toggle', room);
      await wait(1400);
    }
  });
  await toggle('lamp-toggle', false);
  await companion('pear', async () => {
    await toggle('pear-toggle', true);
    await page.locator('#pear-brightness').fill('10');
  });
  await clip('pear-lighting', async () => {
    await page.locator('#pear-open').click();
    await toggle('pear-toggle', true);
    for (const level of ['10', '40', '70', '100']) {
      await page.locator('#pear-brightness').fill(level);
      await wait(1100);
    }
    await toggle('pear-toggle', false);
    await wait(1100);
    await toggle('pear-toggle', true);
    await page.keyboard.press('Escape');
    await wait(1000);
  });
  await toggle('lamp-toggle', true);
  await clip('pear-movement', () => lift('pear', 230));
  await companion('pear', async () => {
    await page.locator('#pear-home').click();
    await page.locator('#pear-brightness').fill('70');
  });
  await screenshot('desk-fresh-pear');
  await toggle('lamp-toggle', false);
  await companion('pear', () => toggle('pear-toggle', false));
  await companion('axolotl', async () => {
    await toggle('axolotl-toggle', true);
    await page.locator('#axolotl-sleep').click();
  });
  await clip('axolotl-lighting', async () => {
    for (const button of ['axolotl-sleep', 'axolotl-bright', 'axolotl-sleep', 'axolotl-bright']) {
      await companion('axolotl', async () => {
        await page.locator(`#${button}`).click();
        await wait(250);
      });
      await wait(1250);
    }
    await companion('axolotl', () => toggle('axolotl-toggle', false));
    await wait(1100);
    await companion('axolotl', () => toggle('axolotl-toggle', true));
    await wait(1000);
  });
  await toggle('lamp-toggle', true);
  await clip('axolotl-movement', () => lift('axolotl', 180));
  await companion('axolotl', async () => {
    await page.locator('#axolotl-home').click();
    await page.locator('#axolotl-sleep').click();
  });
  await companion('pear', () => toggle('pear-toggle', true));
  await screenshot('desk-fresh-axolotl');
  await page.locator('#dock-toggle').click();
  await clip('console-movement', async () => {
    for (const system of ['ds', 'gba']) {
      await page.locator('#consoles-open').click();
      await page.locator(`#move-${system}`).click();
      for (const key of ['ArrowDown', 'PageUp', 'PageUp', 'PageUp', 'ArrowLeft']) {
        await page.keyboard.press(key);
        await wait(160);
      }
      await wait(700);
      await page.keyboard.press('Enter');
      await wait(1800);
    }
  });
  observations.lighting = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { lamp: view.lampOn, room: view.roomLightsOn, pear: view.pearOn,
      pearBrightness: view.pearBrightness, axolotl: view.axolotlOn, axolotlBrightness: view.axolotlBrightness };
  });
}
try {
  await page.goto(baseURL);
  await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await page.locator('#scene-loading').waitFor({ state: 'hidden', timeout: 90000 });
  await wait(1500);
  if (mode === 'ds') await dsCapture();
  else await lightingCapture();
  if (errors.length) throw new Error(errors.join('\n'));
} catch (error) {
  errors.push(error.message);
  await screenshot('capture-failure');
  throw error;
} finally {
  const video = await page.video().path();
  await context.close();
  await browser.close();
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({
    baseURL, checkoutCommit, capturedAt: new Date().toISOString(), mode, video, clips, errors, observations, viewport,
    showcaseRom: mode === 'ds' ? 'Owner-selected local DS cartridge; binary excluded.' : 'No cartridge needed for desk lighting.',
    note: 'Actual browser recording and UI inputs. No scene/material/exposure overrides. Loading clip ends before native readiness; startup wait is outside the clip. This is visual documentation, not universal compatibility, audio or performance qualification.',
  }, null, 2));
}
console.log(`Captured ${Object.keys(clips).length} clips in ${resolve(output, 'capture.json')}`);
