// README capture harness only. Private, newly recorded native openings are looped
// into the existing LCD source setters. UI/geometry/lighting stay unmodified.
// Button/stylus clips demonstrate scene feedback, NOT native game response.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect } from '@playwright/test';

export async function openingReplay(page) {
  console.log('Preparing isolated replay host: GBA and DS scene controls');
  const directory = process.env.BBA_CAPTURE_INTROS;
  if (!directory) throw new Error('BBA_CAPTURE_INTROS must contain verified gba-opening.webm and ds-opening.webm.');
  const sources = {};
  for (const system of ['gba', 'ds']) {
    const path = resolve(directory, `${system}-opening.webm`);
    const body = await readFile(path);
    sources[system] = { path, sha256: createHash('sha256').update(body).digest('hex') };
    await page.route(`**/__capture_opening/${system}.webm`, route =>
      route.fulfill({ contentType: 'video/webm', body }));
  }
  const point = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.project(view.model.screen);
  });
  await page.mouse.click(point.x, point.y);
  await page.locator('#hardware-power').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-power', 'on', { timeout: 30000 });
  await expect(page.locator('#scene')).not.toHaveAttribute('data-booting', 'true', { timeout: 30000 });
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  console.log('Replay host GBA ready; loading DS scene controls');
  if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
  await page.locator('#select-ds').click();
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect.poll(() => page.evaluate(async () => {
    const ds = (await import('./src/app.js')).view.dsController;
    return !!(ds.running && !ds.loading && ds.source);
  }), { timeout: 180000 }).toBe(true);
  console.log('Replay host DS ready; installing private opening videos');
  await page.evaluate(async sources => {
    const { view } = await import('./src/app.js');
    const state = window.__openingReplay = { videos: {}, canvases: {}, original: {}, frames: 0, sources };
    for (const system of ['gba', 'ds']) {
      const video = document.createElement('video');
      video.src = new URL(`__capture_opening/${system}.webm`, document.baseURI).href;
      video.muted = true; video.loop = true; video.preload = 'auto';
      await video.play();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      state.videos[system] = video; state.canvases[system] = canvas;
    }
    state.original.setScreen = view.setScreen;
    state.original.gbaSource = view.source;
    view.setScreen = function (source) {
      state.original.gbaSource = source;
      return state.original.setScreen.call(this, source ? state.canvases.gba : source);
    };
    view.setScreen(state.original.gbaSource);
    const ds = view.dsController;
    state.original.dsSource = ds.source;
    Object.defineProperty(ds, 'source', { configurable: true,
      get: () => state.original.dsSource ? state.canvases.ds : null,
      set: source => { state.original.dsSource = source; } });
    const draw = () => {
      for (const system of ['gba', 'ds'])
        state.canvases[system].getContext('2d').drawImage(state.videos[system], 0, 0);
      state.frames++;
      state.animation = requestAnimationFrame(draw);
    };
    draw();
  }, sources);
  await page.locator('#select-gba').click();
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await page.waitForTimeout(1000);
  console.log('Both verified opening replays installed; scene recording begins');
}

export async function replayTime(page, system, seconds = 0, loop = true) {
  await page.evaluate(async ({ system, seconds, loop }) => {
    const video = window.__openingReplay.videos[system];
    video.pause();
    video.loop = loop;
    video.currentTime = seconds;
    await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
    window.__openingReplay.canvases[system].getContext('2d').drawImage(video, 0, 0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await video.play();
  }, { system, seconds, loop });
}

export async function replayReceipt(page) {
  return page.evaluate(async () => {
    const state = window.__openingReplay;
    if (!state) return null;
    const result = { mechanism: 'Capture-harness-only private native-video replay through GBA setScreen and DS source accessor; no native input-response claim.',
      frames: state.frames, videos: {}, sources: state.sources };
    for (const [system, video] of Object.entries(state.videos))
      result.videos[system] = { duration: video.duration, currentTime: video.currentTime, width: video.videoWidth, height: video.videoHeight,
        paused: video.paused, ended: video.ended, loop: video.loop };
    const { view } = await import('./src/app.js');
    view.setScreen = state.original.setScreen;
    if (view.source === state.canvases.gba && state.original.gbaSource)
      view.setScreen(state.original.gbaSource);
    delete view.dsController.source;
    view.dsController.source = state.original.dsSource;
    cancelAnimationFrame(state.animation);
    for (const video of Object.values(state.videos)) { video.pause(); video.removeAttribute('src'); video.load(); }
    return result;
  });
}
