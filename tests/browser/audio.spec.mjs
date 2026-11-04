import { test, expect } from '@playwright/test';
import { createDemoRom } from '../../scripts/demo-rom.mjs';
import { demoReady, powerOn } from './pixel-lab.mjs';

test('real native audio buffers brief stalls and smooths volume without restarting the game', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.addInitScript(() => {
    window.audioSchedule = { tail: 0, initialStall: null };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, ...rest) {
      const time = Math.max(when, this.context.currentTime);
      const probe = window.audioSchedule;
      if (!probe.initialStall) {
        const lead = time - this.context.currentTime;
        const before = performance.now();
        while (performance.now() - before < 80) { /* Stall the real first scheduling callback. */ }
        probe.initialStall = { lead, remaining: time - this.context.currentTime };
      }
      probe.tail = time + (this.buffer.duration - offset) / this.playbackRate.value;
      return start.call(this, when, offset, ...rest);
    };
  });
  await page.goto('./');
  await expect(page.locator('#rom-file')).toBeEnabled();
  await page.locator('#rom-file').setInputFiles({
    name: 'Pixel Lab Audio.gba', mimeType: 'application/octet-stream',
    buffer: Buffer.from(createDemoRom({ tone: true })),
  });
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  const frame = page.frames().find(item => item.url().endsWith('player.html'));
  const identity = await frame.evaluate(() => window.audioIdentity = crypto.randomUUID());
  await page.locator('#tools-open').click();
  await page.locator('#autosave-toggle').click();
  await page.locator('#native-open').click();
  await frame.evaluate(() => {
    const start = performance.now();
    while (performance.now() - start < 250) { /* Force one native underrun and recovery. */ }
  });
  const audio = await frame.evaluate(async () => {
    const emulator = window.EJS_emulator;
    const ctx = emulator.Module.AL.currentCtx;
    const analyser = ctx.audioCtx.createAnalyser();
    ctx.gain.connect(analyser);
    window.toneAnalyser = analyser;
    const samples = new Float32Array(analyser.fftSize);
    await new Promise(resolve => setTimeout(resolve, 500));
    analyser.getFloatTimeDomainData(samples);
    return {
      state: ctx.audioCtx.state,
      peak: Math.max(...samples.map(Math.abs)),
      latency: emulator.gameManager.FS.readFile('/home/web_user/.config/retroarch/retroarch.cfg', { encoding: 'utf8' })
        .match(/^audio_latency = "(\d+)"$/m)?.[1],
      lead: window.audioSchedule.tail - ctx.audioCtx.currentTime,
      initialStall: window.audioSchedule.initialStall,
    };
  });
  await test.info().attach('native-audio', { body: JSON.stringify(audio), contentType: 'application/json' });
  expect(audio.state).toBe('running');
  await expect.poll(() => frame.evaluate(() => {
    const analyser = window.toneAnalyser;
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  })).toBeGreaterThan(.01);
  expect(audio.latency).toBe('128');
  expect(audio.initialStall.lead).toBeGreaterThan(.09);
  expect(audio.initialStall.remaining).toBeGreaterThan(0);
  await page.locator('#native-close').click();
  await page.locator('#mute').click();
  await expect.poll(() => frame.evaluate(() =>
    window.EJS_emulator.Module.AL.currentCtx.sources.find(Boolean).gain.gain.value)).toBe(0);
  await page.locator('#mute').click();
  await expect.poll(() => frame.evaluate(() =>
    window.EJS_emulator.Module.AL.currentCtx.sources.find(Boolean).gain.gain.value)).toBeCloseTo(.6);
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toHaveText('Resume game');
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toHaveText('Pause game');
  await page.locator('#save').click();
  await expect(page.locator('#restore')).toBeEnabled();
  await page.locator('#restore').click();
  await expect(page.locator('#restore')).toBeEnabled();
  await expect.poll(() => frame.evaluate(() =>
    window.audioSchedule.tail - window.EJS_emulator.Module.AL.currentCtx.audioCtx.currentTime)).toBeGreaterThan(0);
  expect(await frame.evaluate(() => window.audioIdentity)).toBe(identity);
  expect(await frame.evaluate(() => window.EJS_emulator.Module.AL.currentCtx.sources
    .filter(Boolean).every(source => source.bufOffset >= 0))).toBe(true);
});

test('real audio output limits overloaded peaks and fades mute instead of making a hard step', async ({ page }) => {
  await page.goto('./');
  const result = await page.evaluate(async () => {
    const { protectAudio } = await import('./src/audio.js');
    const render = async (mute) => {
      const audioCtx = new OfflineAudioContext(1, 24000, 48000);
      const gain = audioCtx.createGain();
      const sourceGain = audioCtx.createGain();
      sourceGain.connect(gain);
      gain.connect(audioCtx.destination);
      const source = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, 24000, 48000);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = mute ? .5 : 2 * Math.sin(i * 2 * Math.PI * 440 / 48000);
      source.buffer = buffer;
      source.connect(sourceGain);
      const emulator = {
        volume: 1,
        Module: { AL: { currentCtx: { audioCtx, gain, sources: [{ gain: sourceGain }] } } },
        setVolume(value) { sourceGain.gain.value = value; },
      };
      protectAudio(emulator);
      const paused = mute ? audioCtx.suspend(.1) : null;
      source.start();
      const rendered = audioCtx.startRendering();
      if (mute) {
        await paused;
        emulator.setVolume(.5);
        emulator.setVolume(0);
        await audioCtx.resume();
      }
      return (await rendered).getChannelData(0);
    };
    const limited = await render(false);
    const muted = await render(true);
    return {
      peak: Math.max(...limited.subarray(4800).map(Math.abs)),
      earlyMute: Math.max(...muted.subarray(2400, 3840).map(Math.abs)),
      lateMute: Math.max(...muted.subarray(7680).map(Math.abs)),
      muteJump: Math.max(...muted.subarray(4801, 7680).map((sample, index) => Math.abs(sample - muted[index + 4800]))),
    };
  });
  expect(result.peak).toBeLessThan(1);
  expect(result.peak).toBeGreaterThan(.5);
  expect(result.earlyMute).toBeGreaterThan(.01);
  expect(result.lateMute).toBe(0);
  expect(result.muteJump).toBeLessThan(.02);
});

test('unbuffered pinned-runtime control misses playback timing during the same 80 ms stall', async ({ page }) => {
  await page.route('**/src/audio.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export function configureAudioBuffer() {} export function protectAudio() {}',
  }));
  await page.addInitScript(() => {
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when = 0, ...args) {
      if (!window.unbufferedStall) {
        const time = Math.max(when, this.context.currentTime);
        const lead = time - this.context.currentTime;
        const before = performance.now();
        while (performance.now() - before < 80) { /* Identical scheduling-callback stall. */ }
        window.unbufferedStall = { lead, remaining: time - this.context.currentTime };
      }
      return start.call(this, when, ...args);
    };
  });
  await page.goto('./');
  await expect(page.locator('#rom-file')).toBeEnabled();
  await page.locator('#rom-file').setInputFiles({
    name: 'Pixel Lab Audio.gba', mimeType: 'application/octet-stream',
    buffer: Buffer.from(createDemoRom({ tone: true })),
  });
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  const frame = page.frames().find(item => item.url().endsWith('player.html'));
  const result = await frame.evaluate(() => window.unbufferedStall);
  await test.info().attach('unbuffered-control', { body: JSON.stringify(result), contentType: 'application/json' });
  expect(result.lead).toBe(0);
  expect(result.remaining).toBeLessThan(0);
});
