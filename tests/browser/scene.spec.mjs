import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const sceneState = (page) => page.evaluate(async () => {
  const { view } = await import('./src/app.js');
  if (!view) return null;
  const root = view.model.root;
  const { Vector3 } = await import('three');
  const front = new Vector3(0, 0, 1).applyQuaternion(root.quaternion);
  const towardCamera = view.camera.position.clone().sub(root.position).normalize();
  return {
    triangles: view.renderer.info.render.triangles,
    y: root.position.y,
    frontFacing: front.dot(towardCamera),
    quaternion: root.quaternion.toArray(),
    rear: !!root.getObjectByName('Battery cover'),
  };
});

test('real 3D mesh picking, pickup, back inspection, return and responsive physical controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect.poll(async () => (await sceneState(page))?.triangles).toBeGreaterThan(1000);
  const resting = await sceneState(page);
  expect(resting.y).toBeLessThan(1);
  expect(resting.rear).toBe(true);
  await mkdir('docs/images', { recursive: true });
  await page.screenshot({ path: 'docs/images/3d-table.png' });
  const point = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.project(view.model.screen);
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await sceneState(page)).y).toBeGreaterThan(3);
  expect((await sceneState(page)).frontFacing).toBeGreaterThan(.95);
  const surfaces = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const root = view.model.root;
    root.updateWorldMatrix(true, true);
    const hit = (x, y) => {
      const origin = root.localToWorld(new Vector3(x, y, 4));
      const direction = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
      const [intersection] = new Raycaster(origin, direction).intersectObject(root, true);
      if (!intersection) throw new Error(`Missing front surface at ${x}, ${y}`);
      return { name: intersection.object.name, z: root.worldToLocal(intersection.point.clone()).z };
    };
    return {
      lcd: hit(0, .22).name,
      speakerDepth: hit(3.02, -.87).z - hit(3.02, -.79).z,
      pivotDepth: hit(-2.98, .26).z - hit(-3.2, .26).z,
    };
  });
  expect(surfaces.lcd, 'The bezel must not occlude the actual display plane').toBe('Live LCD');
  expect(surfaces.speakerDepth, 'Speaker slots must be recessed openings, not raised rails').toBeGreaterThan(.02);
  expect(surfaces.pivotDepth, 'The D-pad center must be a shallow well').toBeGreaterThan(.01);
  expect(surfaces.pivotDepth).toBeLessThan(.05);
  await page.screenshot({ path: 'docs/images/3d-handheld.png' });
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect(page.locator('[data-control="a"]')).toBeHidden();
  const canvas = await page.locator('#scene-canvas').boundingBox();
  await page.mouse.move(canvas.width / 2, canvas.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvas.width / 2 + 385, canvas.height / 2 + 12, { steps: 12 });
  await page.mouse.up();
  expect((await sceneState(page)).frontFacing).toBeLessThan(-.9);
  await page.screenshot({ path: 'docs/images/3d-back.png' });
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Home');
  expect((await sceneState(page)).frontFacing).toBeGreaterThan(.95);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  for (const [width, height] of [[1366, 768], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    const bounds = await page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      const { Box3, Vector3 } = await import('three');
      const box = new Box3().setFromObject(view.model.root);
      const points = [];
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const point = new Vector3(x, y, z).project(view.camera);
        points.push({ x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 });
      }
      return {
        left: Math.min(...points.map(({ x }) => x)), right: Math.max(...points.map(({ x }) => x)),
        top: Math.min(...points.map(({ y }) => y)), bottom: Math.max(...points.map(({ y }) => y)),
        scroll: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(bounds.left, `Actual mesh fits ${width}x${height}`).toBeGreaterThan(0);
    expect(bounds.right).toBeLessThan(width);
    expect(bounds.top).toBeGreaterThan(0);
    expect(bounds.bottom).toBeLessThan(height);
    expect(bounds.scroll).toBe(false);
  }
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  expect((await sceneState(page)).y).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('CRT Geom is active natively and its retained live framebuffer textures the 3D LCD', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const evidence = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const emulator = document.querySelector('#frame-host iframe').contentWindow.EJS_emulator;
    return {
      shader: emulator.getSettingValue('shader'),
      preset: emulator.Module.FS.readFile('/shader/shader.glslp', { encoding: 'utf8' }),
      retained: (emulator.canvas.getContext('webgl2') || emulator.canvas.getContext('webgl')).getContextAttributes().preserveDrawingBuffer,
      sameCanvas: view.model.screen.material.map.image === emulator.canvas,
    };
  });
  expect(evidence.shader).toBe('crt-geom.glslp');
  expect(evidence.preset).toContain('shader0 = crt-geom.glsl');
  expect(evidence.retained).toBe(true);
  expect(evidence.sameCanvas).toBe(true);
  const pixelHash = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const canvas = document.createElement('canvas');
    canvas.width = view.source.width;
    canvas.height = view.source.height;
    const context = canvas.getContext('2d');
    context.drawImage(view.source, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    let lit = 0;
    for (let i = 0; i < pixels.length; i++) {
      hash = Math.imul(hash ^ pixels[i], 16777619);
      if (i % 4 !== 3 && pixels[i] > 0) lit++;
    }
    return { hash: hash >>> 0, lit, version: view.model.screen.material.map.version };
  });
  await expect.poll(async () => (await pixelHash()).lit).toBeGreaterThan(10000);
  const filtered = await pixelHash();
  await page.locator('#scene-canvas').click();
  await page.keyboard.down('z');
  await page.waitForTimeout(150);
  expect((await pixelHash()).hash).not.toBe(filtered.hash);
  expect((await pixelHash()).version).toBeGreaterThan(filtered.version);
  await page.keyboard.up('z');
  await page.locator('#tools-open').click();
  await expect(page.locator('#shader')).toHaveValue('crt-geom.glslp');
  await page.locator('#shader').selectOption('disabled');
  await expect(page.locator('#shader')).toBeEnabled();
  await page.waitForTimeout(150);
  expect((await pixelHash()).hash).not.toBe(filtered.hash);
  const child = page.frames().find((frame) => frame.url().endsWith('player.html'));
  expect(await child.evaluate(() => window.EJS_emulator.getSettingValue('shader'))).toBe('disabled');
  await page.reload();
  await page.locator('#tools-open').click();
  await expect(page.locator('#shader')).toHaveValue('disabled');
  expect(errors).toEqual([]);
});

test('reduced motion skips the pickup tween and unavailable WebGL fails explicitly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect.poll(async () => (await sceneState(page))?.triangles).toBeGreaterThan(1000);
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.transition)).toBe(null);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      return /webgl/.test(type) ? null : original.call(this, type, options);
    };
  });
  await page.reload();
  await expect(page.locator('#scene-error')).toContainText('needs WebGL 2');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await expect(page.locator('#notice')).toContainText('needs WebGL 2');
  await expect(page.locator('#pause')).toBeDisabled();
});

test.describe('mobile 3D inspection', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('touch inspection rotates and pinches without sending game input, then returns to play', async ({ page }) => {
    await page.goto('./');
    await page.locator('#tools-open').tap();
    await page.locator('#demo').tap();
    await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    const child = page.frames().find((frame) => frame.url().endsWith('player.html'));
    const image = () => child.evaluate(async () => [...await window.EJS_emulator.gameManager.screenshot()]);
    const before = await image();
    await page.locator('#inspect').tap();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
    const distance = () => page.evaluate(async () => (await import('./src/app.js')).view.camera.position.z);
    const initialDistance = await distance();
    const cdp = await page.context().newCDPSession(page);
    const touch = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(1, 165, 422)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(1, 165, 422), touch(2, 225, 422)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(1, 125, 422), touch(2, 265, 422)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await distance()).toBeLessThan(initialDistance * .8);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(3, 150, 400)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(3, 260, 440)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect((await sceneState(page)).frontFacing).toBeLessThan(.9);
    await page.keyboard.press('ArrowRight');
    expect(await image()).toEqual(before);
    await page.locator('#inspect').tap();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    await page.locator('#put-down').tap();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');
    expect(await image()).toEqual(before);
    await page.locator('#pickup').tap();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');
    expect(await image()).not.toEqual(before);
    await cdp.detach();
  });
});
