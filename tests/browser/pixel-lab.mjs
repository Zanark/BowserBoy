import { expect } from '@playwright/test';

export const nativeFrame = (page) => page.frames().find((frame) => frame.url().endsWith('player.html')).evaluate(async () => {
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

export const demoReady = (page) => expect.poll(async () => (await nativeFrame(page)).ready).toBe(true);
