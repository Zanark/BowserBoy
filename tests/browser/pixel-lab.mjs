import { expect } from '@playwright/test';

export const installRoomPaintFixture = page => page.evaluate(async () => {
  const { view } = await import('./src/app.js');
  let recovery;
  window.roomPaintFixture = {
    async waitForGpu() {
      const gl = view.renderer.getContext();
      while (view.paintFence) {
        const status = gl.clientWaitSync(view.paintFence, 0, 0);
        if (status === gl.WAIT_FAILED || gl.isContextLost()) throw new Error('Room fixture GPU synchronization failed.');
        if (status !== gl.TIMEOUT_EXPIRED) return;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    },
    async waitForRecovery() {
      // Synthetic render timestamps do not advance the real recovery wait.
      const delay = Math.max(0, view.nextPaint - (view.lastRender ?? view.nextPaint));
      if (!Number.isFinite(delay) || delay > 1000 + 1e-6)
        throw new Error('Room fixture recovery must be finite and at most one second.');
      if (!delay) { recovery = null; return; }
      if (!recovery || recovery.nextPaint !== view.nextPaint || recovery.lastPaint !== view.lastPaint)
        recovery = { nextPaint: view.nextPaint, lastPaint: view.lastPaint, until: performance.now() + delay };
      while (performance.now() < recovery.until)
        await new Promise(resolve => setTimeout(resolve, recovery.until - performance.now()));
    },
    async paint(time) {
      await this.waitForGpu();
      await this.waitForRecovery();
      if (!Number.isFinite(time) || time < view.nextPaint)
        throw new Error('Room fixture timestamp precedes the eligible recovery boundary.');
      view.render(time);
      if (!view.renderedLastFrame) throw new Error('Room fixture did not submit the intended complete frame.');
      // Callers can read the default framebuffer now, before another browser task.
    },
  };
});

export const denyScreenWakeLock = async (page) => {
  const cdp = await page.context().newCDPSession(page);
  const { targetInfo } = await cdp.send('Target.getTargetInfo');
  await cdp.send('Browser.setPermission', {
    permission: { name: 'screen-wake-lock' },
    setting: 'denied',
    origin: new URL(page.url()).origin,
    browserContextId: targetInfo.browserContextId,
  });
  // Detaching would clear the denial; the test's browser context owns this session.
  expect(await page.evaluate(async () =>
    (await navigator.permissions.query({ name: 'screen-wake-lock' })).state)).toBe('denied');
};

export const powerOn = async (page) => {
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await expect(page.locator('#hardware-power')).toBeEnabled({ timeout: 90000 });
  if (await page.locator('#scene').getAttribute('data-power') === 'on') return;
  if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
  await page.locator('#hardware-power').click();
};

const runtimeFrames = new WeakMap();

export const runtimeFrame = async (page, mount = '#runtime-mount') => {
  let frames = runtimeFrames.get(page);
  if (!frames) { frames = new Map(); runtimeFrames.set(page, frames); }
  const cached = frames.get(mount);
  // Repeated frame lookups add GPU-blocked protocol roundtrips to every pixel probe.
  if (cached && !cached.isDetached()) return cached;
  const frame = await (await page.locator(`${mount} iframe`).elementHandle()).contentFrame();
  if (!frame) throw new Error('The emulator iframe is not attached.');
  frames.set(mount, frame);
  return frame;
};

export const nativeFrame = async (page) => {
  const frame = await runtimeFrame(page);
  return frame.evaluate(async () => {
  const png = await window.EJS_emulator.gameManager.screenshot();
  const bitmap = await createImageBitmap(new Blob([png], { type: 'image/png' }));
  const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Pixel Lab frame verification requires a 2D canvas.');
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
  let count = 0, left = bitmap.width, top = bitmap.height, right = -1, bottom = -1;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === data[0] && data[i + 1] === data[1] && data[i + 2] === data[2]) continue;
    const pixel = i / 4, x = pixel % bitmap.width, y = Math.floor(pixel / bitmap.width);
    count++; left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const ready = bitmap.width === 240 && bitmap.height === 160 && count === 64 && right - left === 7 && bottom - top === 7;
  bitmap.close();
  return { png: [...png], ready, left };
  });
};

export const demoReady = (page) => expect.poll(async () => (await nativeFrame(page)).ready).toBe(true);
