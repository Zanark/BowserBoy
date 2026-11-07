// Dedicated complete-window scene recordings, with looping disabled at the tail.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { openingReplay, replayTime, replayReceipt } from './capture-opening-replay.mjs';

const output = process.argv[2];
if (!output) throw new Error('Usage: capture-opening-showcases.mjs <private-output>');
await mkdir(output, { recursive: true });
const baseURL = process.env.BBA_CAPTURE_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const viewport = { width: 1100, height: 850 };
const context = await browser.newContext({ viewport, recordVideo: { dir: output, size: viewport } });
const started = Date.now(), page = await context.newPage(), clips = {}, errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
let replay;
try {
  await page.goto(baseURL);
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await page.locator('#scene-loading').waitFor({ state: 'hidden', timeout: 90000 });
  await openingReplay(page);
  for (const [system, duration, sourceWindow] of [['gba', 27.5, [2.5, 30]], ['ds', 82, [8, 90]]]) {
    await page.locator(`#select-${system}`).click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    await page.waitForTimeout(1200);
    await page.evaluate(({ system, duration }) => {
      const actual = window.__openingReplay.videos[system].duration;
      if (Math.abs(actual - duration) > .04) throw new Error(`Opening duration ${actual} does not cover ${duration}s`);
    }, { system, duration });
    await replayTime(page, system, 0, false);
    clips[`${system}-gameplay`] = { start: (Date.now() - started) / 1000, encodedDuration: duration, sourceWindow };
    console.log(`Recording complete ${system} opening: ${duration}s, no loop wrap`);
    await page.waitForTimeout(duration * 1000);
    clips[`${system}-gameplay`].duration = (Date.now() - started) / 1000 - clips[`${system}-gameplay`].start;
    await replayTime(page, system, 0);
  }
  if (errors.length) throw new Error(errors.join('\n'));
} catch (error) {
  errors.push(error.message);
  await page.screenshot({ path: resolve(output, 'capture-failure.png') });
  throw error;
} finally {
  replay = await replayReceipt(page).catch(() => null);
  const video = await page.video().path();
  await context.close();
  await browser.close();
  await writeFile(resolve(output, 'capture.json'), JSON.stringify({
    baseURL, checkoutCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    capturedAt: new Date().toISOString(), viewport, video, clips, errors, replay,
    note: 'Complete native-opening windows replayed once on actual 3D LCDs, not native input-response evidence. Final available native frame is held through the requested exact window end.',
  }, null, 2));
}
