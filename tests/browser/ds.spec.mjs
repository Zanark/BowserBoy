import { test, expect } from '@playwright/test';
import { demoReady, powerOn, denyScreenWakeLock } from './pixel-lab.mjs';

const dsFrame = async page => (await page.locator('#ds-runtime-mount iframe').elementHandle()).contentFrame();
const stylusFits = (page, limitY = .98) => page.evaluate(async limit => {
  const { view } = await import('./src/app.js'), { Box3, Vector3 } = await import('three');
  const box = new Box3().setFromObject(view.ds.stylus);
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const point = new Vector3(x, y, z).project(view.camera);
    if (Math.abs(point.x) >= .98 || Math.abs(point.y) >= limit) return false;
  }
  return true;
}, limitY);
const framePixels = async (page, point) => (await dsFrame(page)).evaluate(async point => {
  const png = await window.EJS_emulator.gameManager.screenshot();
  const bitmap = await createImageBitmap(new Blob([png], { type: 'image/png' }));
  const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const pixel = (x, y) => [...data.slice((y * bitmap.width + x) * 4, (y * bitmap.width + x) * 4 + 3)];
  const find = (color, start, end, xStart = 0, xEnd = bitmap.width) => {
    let left = bitmap.width, top = end, count = 0;
    for (let y = start; y < end; y++) for (let x = xStart; x < xEnd; x++) {
      if (pixel(x, y).every((value, i) => Math.abs(value - color[i]) < 10)) { count++; left = Math.min(left, x); top = Math.min(top, y); }
    }
    return { left, top, count };
  };
  const result = {
    size: [bitmap.width, bitmap.height], top: pixel(0, 0), bottom: pixel(0, 192),
    marker: find([222, 214, 49], 75, 155), touch: find([255, 255, 0], 257, 353),
    probe: point ? pixel(point.x, point.y + 192) : null,
    brush: point ? find([255, 255, 0], Math.max(192, point.y + 180), Math.min(384, point.y + 205),
      Math.max(0, point.x - 12), Math.min(256, point.x + 13)) : null,
  };
  bitmap.close(); return result;
}, point);

async function bootDsDemo(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#select-ds')).toBeEnabled({ timeout: 90000 });
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await page.evaluate(async () => clearInterval((await import('./src/app.js')).view.dsController.autosave));
  return errors;
}

test('separate DS boots original homebrew, splits both LCDs and accepts buttons and physical-screen stylus', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await page.locator('#room-toggle').click();
  await page.locator('#room-toggle').blur();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: testInfo.outputPath('ds-table.png') });
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-power', 'on');
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await page.screenshot({ path: testInfo.outputPath('ds-flat-playing.png') });
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('#ds-inspect-action').selectOption('hinge');
  await page.locator('#scene-canvas').focus();
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowDown');
  await page.locator('#ds-pose-lock').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    clearInterval(view.dsController.autosave);
  });
  await page.screenshot({ path: testInfo.outputPath('ds-playing.png') });
  expect((await framePixels(page)).size).toEqual([256, 384]);
  expect((await framePixels(page)).top).not.toEqual((await framePixels(page)).bottom);
  await expect.poll(async () => (await framePixels(page)).marker.count).toBe(64);
  const physical = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), THREE = await import('three');
    view.renderer.render(view.scene, view.camera);
    return view.ds.screens.map(screen => {
      const point = new THREE.Vector3((30 / 256 - .5) * 4.5, (.5 - 90 / 192) * 3.375, 0);
      screen.localToWorld(point); point.project(view.camera);
      const gl = view.renderer.getContext(), rgba = new Uint8Array(4);
      gl.readPixels(Math.round((point.x + 1) * view.canvas.width / 2), Math.round((point.y + 1) * view.canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return [...rgba].slice(0, 3);
    });
  });
  const native = await framePixels(page);
  for (const [i, color] of [native.top, native.bottom].entries()) {
    expect(physical[i].every((value, channel) => Math.abs(value - color[channel]) <= 10)).toBe(true);
  }
  const before = (await framePixels(page)).marker.left;
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await framePixels(page)).marker.left).toBeGreaterThan(before + 4);
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.transition === null && view.dsController.inputAllowed();
  })).toBe(true);
  const point = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const THREE = await import('three');
    const point = new THREE.Vector3(.5, 0, 0);
    view.ds.screens[1].localToWorld(point);
    point.project(view.camera);
    const bounds = view.canvas.getBoundingClientRect();
    return { x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await expect.poll(async () => (await framePixels(page)).touch.count).toBeGreaterThan(0);
  await page.mouse.up();
  expect((await framePixels(page)).touch.left).toBeGreaterThan(128);
  expect((await framePixels(page)).touch.left).toBeLessThan(200);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#ds-pose-lock').click();
  await page.locator('#ds-hinge').focus();
  await page.keyboard.press('Home');
  await page.locator('#ds-pose-lock').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await expect(page.locator('[data-ds-control="right"]')).toBeHidden();
  expect(await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    const point = view.ds.screens[1].localToWorld(new Vector3()).project(view.camera);
    const bounds = view.canvas.getBoundingClientRect();
    return view.dsController.inputAllowed() && view.dsController.touchAt({
      clientX: bounds.x + (point.x + 1) * bounds.width / 2,
      clientY: bounds.y + (1 - point.y) * bounds.height / 2,
    }) === null;
  })).toBe(true);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#ds-pose-lock').click();
  await page.evaluate(async () => (await import('./src/app.js')).view.setDsHinge(145));
  await page.locator('#ds-pose-lock').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect(errors).toEqual([]);
});

test('DS native backups restore the saved framebuffer after further input', async ({ page }, testInfo) => {
  const errors = await bootDsDemo(page);
  const savedLeft = (await framePixels(page)).marker.left;
  await page.locator('#ds-open').click();
  await page.locator('#ds-save').click();
  await expect(page.locator('#ds-status')).toContainText('DS checkpoint saved');
  await expect(page.locator('#ds-save')).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.locator('#ds-export').click();
  const backup = await download;
  expect(backup.suggestedFilename()).toMatch(/\.bbds-save$/);
  const backupPath = testInfo.outputPath('Twin Lab.bbds-save');
  await backup.saveAs(backupPath);
  await page.locator('#ds-close').click();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await framePixels(page)).marker.left).toBeLessThan(savedLeft - 4);
  await page.keyboard.up('ArrowLeft');
  await page.locator('#ds-open').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#ds-backup-file').setInputFiles(backupPath);
  await expect(page.locator('#ds-status')).toContainText('DS backup restored');
  await expect.poll(async () => (await framePixels(page)).marker.left).toBe(savedLeft);
  await page.locator('#ds-close').click();
  expect(errors).toEqual([]);
});

test('DS and GBA retain isolated cores and saves while DS power starts cold', async ({ page }, testInfo) => {
  const errors = await bootDsDemo(page);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await framePixels(page)).marker.left).toBeGreaterThan(140);
  await page.keyboard.up('ArrowRight');
  const savedLeft = (await framePixels(page)).marker.left;
  const frame = await dsFrame(page);
  await page.locator('#select-gba').click();
  await expect.poll(() => frame.evaluate(() => window.EJS_emulator.paused)).toBe(true);
  await powerOn(page);
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  const gba = await (await page.locator('#runtime-mount iframe').elementHandle()).contentFrame();
  await page.locator('#select-ds').click();
  await expect.poll(() => gba.evaluate(() => window.EJS_emulator.paused)).toBe(true);
  await expect.poll(() => frame.evaluate(() => window.EJS_emulator.paused)).toBe(false);
  await expect.poll(async () => (await framePixels(page)).marker.left).toBe(savedLeft);
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name));
  expect(databases).toContain('bowserboy-ds');
  expect(databases).toContain('bowser-boy-advance');
  await page.screenshot({ path: testInfo.outputPath('ds-with-gba-retained.png') });
  await page.locator('#ds-hardware-power').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-power', 'off');
  await expect(page.locator('#ds-runtime-mount iframe')).toHaveCount(0);
  await page.locator('#ds-hardware-power').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await expect.poll(async () => (await framePixels(page)).marker.left).toBe(120);
  expect(await gba.evaluate(() => window.EJS_emulator.paused)).toBe(true);
  expect(errors).toEqual([]);
});

test('DS reload resumes the latest manual checkpoint rather than a cold game', async ({ page }) => {
  const errors = await bootDsDemo(page);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await framePixels(page)).marker.left).toBeGreaterThan(140);
  await page.keyboard.up('ArrowRight');
  const savedLeft = (await framePixels(page)).marker.left;
  await page.locator('#ds-open').click();
  await page.locator('#ds-save').click();
  await expect(page.locator('#ds-status')).toContainText('DS checkpoint saved');
  await expect(page.locator('#ds-save')).toBeEnabled();
  page.once('dialog', dialog => dialog.accept());
  await page.reload();
  await expect(page.locator('#select-ds')).toBeEnabled({ timeout: 90000 });
  await page.locator('#select-ds').click();
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('Latest DS checkpoint resumed', { timeout: 90000 });
  await expect.poll(async () => (await framePixels(page)).marker.left).toBe(savedLeft);
  expect(errors).toEqual([]);
});

for (const pose of [
  { name: 'flat corners', rotation: [0, 0, 0], hinge: 180, points: [[200, 150], [0, 0], [255, 191]] },
  { name: 'rolled', rotation: [-.25, .3, .25], hinge: 135, points: [[28, 32], [120, 90], [224, 184]] },
  { name: 'upside-down', rotation: [.15, -.2, Math.PI], hinge: 155, points: [[52, 60], [156, 116], [188, 180]] },
  { name: 'high-DPI phone', rotation: [-.15, .2, -.25], hinge: 150, points: [[76, 32], [88, 136], [232, 136]], phone: true },
]) {
test(`DS stylus draws under the pointer across locked orientations, zoom and high-DPI touch (${pose.name})`, async ({ page }, testInfo) => {
  const errors = await bootDsDemo(page);
  const cdp = await page.context().newCDPSession(page);
  if (pose.phone) {
    await page.setViewportSize({ width: 390, height: 844 });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: false,
    });
    expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
  }
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  if (await page.locator('#ds-pose-lock').getAttribute('aria-pressed') === 'true') await page.locator('#ds-pose-lock').click();
  await page.evaluate(async ({ rotation, hinge }) => {
    const { view } = await import('./src/app.js'), { Euler } = await import('three');
    view.ds.root.quaternion.setFromEuler(new Euler(...rotation));
    view.setDsHinge(hinge);
  }, pose);
  await page.locator('#ds-pose-lock').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#play-zoom').fill(pose.phone ? '65' : '50');
  await page.locator('#scene-canvas').focus();
  for (const [index, [x, y]] of pose.points.entries()) {
    const pointer = await page.evaluate(async ({ x, y }) => {
      const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
      const point = view.ds.screens[1].localToWorld(new Vector3(
        ((x + .5) / 256 - .5) * 4.5, (.5 - (y + .5) / 192) * 3.375, 0,
      )).project(view.camera);
      const bounds = view.canvas.getBoundingClientRect();
      const event = { clientX: bounds.left + (point.x + 1) * bounds.width / 2,
        clientY: bounds.top + (1 - point.y) * bounds.height / 2 };
      return { x: event.clientX, y: event.clientY, mapped: view.dsController.touchAt(event) };
    }, { x, y });
    expect(pointer.mapped).toEqual({ x, y });
    expect((await framePixels(page, { x, y })).probe).not.toEqual([255, 255, 0]);
    if (pose.phone) {
      await cdp.send('Input.dispatchTouchEvent', { type: index ? 'touchMove' : 'touchStart', touchPoints: [{ id: 1, x: pointer.x, y: pointer.y }] });
    } else {
      await page.mouse.move(pointer.x, pointer.y);
      if (!index) await page.mouse.down();
    }
    const actual = await page.evaluate(async () => (await import('./src/app.js')).view.dsController.lastTouch);
    expect(Math.abs(actual.x - x)).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.y - y)).toBeLessThanOrEqual(1);
    let pixels;
    await expect.poll(async () => {
      pixels = await framePixels(page, { x, y });
      return pixels.probe;
    },
      { message: `native stylus mark at (${x}, ${y}), rotation ${pose.rotation}` }).toEqual([255, 255, 0]);
    await expect(page.locator('#scene-canvas')).toBeFocused();
    expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsController.touchPointer)).toBeDefined();
    const { brush } = pixels;
    expect(brush.count, `isolated native brush at (${x}, ${y})`).toBe(64);
    expect(Math.abs(brush.left - Math.max(0, Math.min(248, x - 4)))).toBeLessThanOrEqual(1);
    expect(Math.abs(brush.top - 192 - Math.max(0, Math.min(184, y - 4)))).toBeLessThanOrEqual(1);
    await expect.poll(() => page.evaluate(async ({ x, y }) => {
      const { view } = await import('./src/app.js'), bounds = view.canvas.getBoundingClientRect();
      view.renderer.render(view.scene, view.camera);
      const gl = view.renderer.getContext(), rgba = new Uint8Array(36);
      // LCD corners can land between antialiased drawing-buffer pixels.
      gl.readPixels(Math.floor((x - bounds.left) / bounds.width * view.canvas.width) - 1,
        Math.floor((1 - (y - bounds.top) / bounds.height) * view.canvas.height) - 1,
        3, 3, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return rgba.some((value, i) => i % 4 === 0 && value >= 245 && rgba[i + 1] >= 245 && rgba[i + 2] <= 10);
    }, pointer), { message: `yellow physical LCD pixel directly under (${x}, ${y})` }).toBe(true);
  }
  if (pose.phone) {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsController.touchPointer)).toBeUndefined();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else await page.mouse.up();
  await page.screenshot({ path: testInfo.outputPath(pose.phone ? 'ds-precise-stylus-phone.png' : `ds-precise-stylus-${pose.hinge}.png`) });
  await cdp.detach();
  expect(errors).toEqual([]);
});
}

test('DS quick taps reach their clicked pixels without holding, with and without the pen', async ({ page }, testInfo) => {
  await page.goto('./');
  await denyScreenWakeLock(page);
  await expect(page.locator('#select-ds')).toBeEnabled({ timeout: 90000 });
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await page.evaluate(async () => clearInterval((await import('./src/app.js')).view.dsController.autosave));
  const frame = await dsFrame(page);
  await frame.evaluate(() => {
    window.touchEdges = [];
    for (const type of ['mousedown', 'mouseup']) window.EJS_emulator.canvas.addEventListener(type, event => {
      window.touchEdges.push({ type: event.type, frame: window.EJS_emulator.gameManager.getFrameNum() });
    });
  });
  const cdp = await page.context().newCDPSession(page);
  for (const [held, pixels, phone] of [
    [false, [[32, 80], [72, 80], [112, 80], [152, 80]]],
    [true, [[40, 128], [88, 128], [136, 128], [192, 128]]],
    [true, [[44, 160], [100, 160], [160, 160], [212, 160]], true],
  ]) {
    if (phone) {
      await page.locator('#inspect').click();
      await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
      await page.evaluate(async () => {
        const { view } = await import('./src/app.js'), { Euler } = await import('three');
        view.ds.root.quaternion.setFromEuler(new Euler(.15, -.2, Math.PI));
        view.setDsHinge(155);
      });
      await page.locator('#ds-pose-lock').click();
      await page.locator('#inspect').click();
      await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('#play-zoom').fill('65');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390, height: 844, deviceScaleFactor: 2, mobile: false,
      });
    }
    if (held) await page.locator('#ds-stylus').click();
    const targets = await page.evaluate(async pixels => {
      const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
      const bounds = view.canvas.getBoundingClientRect();
      return pixels.map(([x, y]) => {
        const point = view.ds.screens[1].localToWorld(new Vector3(
          ((x + .5) / 256 - .5) * 4.5, (.5 - (y + .5) / 192) * 3.375, 0,
        )).project(view.camera);
        return { x, y, clientX: bounds.left + (point.x + 1) * bounds.width / 2,
          clientY: bounds.top + (1 - point.y) * bounds.height / 2 };
      });
    }, pixels);
    for (const point of targets) {
      if (phone) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart', touchPoints: [{ id: 1, x: point.clientX, y: point.clientY }],
        });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await page.mouse.click(point.clientX, point.clientY);
    }
    await expect.poll(() => page.evaluate(async targets => {
      const { view } = await import('./src/app.js'), ds = view.dsController;
      const native = new OffscreenCanvas(256, 384).getContext('2d');
      native.imageSmoothingEnabled = false;
      native.drawImage(ds.source, 0, 0, 256, 384);
      const displayed = ds.outputs[1].getContext('2d');
      return targets.map(({ x, y }) => ({
        x, y,
        native: [...native.getImageData(x, y + 192, 1, 1).data].slice(0, 3),
        displayed: [...displayed.getImageData(x, y, 1, 1).data].slice(0, 3),
      }));
    }, targets), { timeout: 1500, intervals: [20, 40, 80],
      message: 'every quick tap reaches the native framebuffer and naturally repainted lower LCD' })
      .toEqual(targets.map(({ x, y }) => ({ x, y, native: [255, 255, 0], displayed: [255, 255, 0] })));
    expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsController.touchPointer)).toBeUndefined();
    await expect.poll(() => frame.evaluate(() => window.touchEdges.at(-1)?.type)).toBe('mouseup');
  }
  const edges = await frame.evaluate(() => window.touchEdges);
  expect(edges).toHaveLength(24);
  for (let index = 0; index < edges.length; index += 2) {
    expect(edges[index].type).toBe('mousedown');
    expect(edges[index + 1].type).toBe('mouseup');
    expect(edges[index + 1].frame).toBeGreaterThan(edges[index].frame);
  }
  await cdp.detach();
  await page.screenshot({ path: testInfo.outputPath('ds-quick-taps.png') });
});

test('both DS LCDs cast independent framebuffer-colored spill and go dark with black or power-off', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    clearInterval(view.dsController.autosave);
    view.setPearEnabled(false);
  });
  if (await page.locator('#lamp-toggle').getAttribute('aria-pressed') === 'true') await page.locator('#lamp-toggle').click();
  await page.locator('#lamp-toggle').blur();
  await expect.poll(() => page.evaluate(async () =>
    (await import('./src/app.js')).view.renderer.toneMappingExposure)).toBeCloseTo(.45, 4);
  await expect.poll(() => page.evaluate(async () =>
    (await import('./src/app.js')).view.dsScreenIllumination.every(light => light.light.intensity > 0))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('ds-native-dark-room-spill.png') });
  await page.locator('#ds-open').click();
  await page.locator('#ds-pause').click();
  await page.locator('#ds-close').click();
  const runtime = await dsFrame(page);
  const fill = async colors => {
    await runtime.evaluate(colors => {
      const canvas = window.EJS_emulator.canvas;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const scissor = gl.isEnabled(gl.SCISSOR_TEST), box = gl.getParameter(gl.SCISSOR_BOX);
      const clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      try {
        gl.enable(gl.SCISSOR_TEST);
        for (const [index, color] of colors.entries()) {
          gl.scissor(0, index ? 0 : canvas.height / 2, canvas.width, canvas.height / 2);
          gl.clearColor(...color, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        }
      } finally {
        gl.clearColor(...clear); gl.scissor(...box);
        if (!scissor) gl.disable(gl.SCISSOR_TEST);
      }
    }, colors);
    await expect.poll(() => page.evaluate(async colors => {
      const { view } = await import('./src/app.js'), { Color } = await import('three');
      return view.dsScreenIllumination.every((light, index) => {
        const expected = new Color(...colors[index]).convertSRGBToLinear().toArray();
        return light.settled && light.current.toArray().every((value, axis) => Math.abs(value - expected[axis]) < .001);
      });
    }, colors)).toBe(true);
  };
  await fill([[1, 0, 0], [0, 0, 1]]);
  await page.screenshot({ path: testInfo.outputPath('ds-independent-red-blue-spill.png') });
  const shell = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    view.renderer.render(view.scene, view.camera);
    const gl = view.renderer.getContext();
    return ['up', 'a', 'b', 'start', 'select'].map(id => {
      const point = view.ds.controls.get(id).mesh.localToWorld(new Vector3(.06, .04, .05)).project(view.camera);
      const pixels = new Uint8Array(3 * 3 * 4);
      gl.readPixels(Math.round((point.x + 1) * view.canvas.width / 2) - 1,
        Math.round((point.y + 1) * view.canvas.height / 2) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return [id, ...[0, 1, 2].map(channel =>
        pixels.reduce((sum, value, index) => sum + (index % 4 === channel ? value : 0), 0) / 9)];
    });
  });
  await fill([[1, 1, 1], [1, 1, 1]]);
  const lit = await shell();
  for (const [id, ...rgb] of lit) expect(Math.max(...rgb), `${id} catches local LCD spill`).toBeGreaterThan(2);
  await page.screenshot({ path: testInfo.outputPath('ds-white-control-spill.png') });
  await fill([[0, 0, 0], [0, 0, 0]]);
  const dark = await shell();
  for (const [index, [id, ...rgb]] of dark.entries()) {
    expect(Math.max(...rgb), `${id} dims with black LCDs`).toBeLessThan(Math.max(...lit[index].slice(1)));
  }
  await testInfo.attach('ds-control-spill-pixels', { body: JSON.stringify({ lit, dark }), contentType: 'application/json' });
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsScreenIllumination
    .map(light => [light.light.intensity, light.controlSpill.intensity]))).toEqual([[0, 0], [0, 0]]);
  await fill([[1, 0, 0], [0, 0, 1]]);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  const carried = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Euler, Vector3 } = await import('three');
    view.ds.root.quaternion.setFromEuler(new Euler(.2, -.3, .4)); view.setDsHinge(130);
    view.ds.root.updateMatrixWorld(true);
    return view.dsScreenIllumination.map((light, index) => {
      const screen = view.ds.screens[index];
      return light.light.parent === screen && light.controlSpill.parent === screen &&
        light.light.getWorldPosition(new Vector3()).distanceTo(screen.localToWorld(new Vector3(0, 0, .002))) < .00001;
    });
  });
  expect(carried).toEqual([true, true]);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-hardware-power').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-power', 'off');
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.dsScreenIllumination
    .map(light => [light.light.intensity, light.controlSpill.intensity]))).toEqual([[0, 0], [0, 0]]);
  expect(errors).toEqual([]);
});

test('gameplay hints stay on one bottom-left line instead of covering the LCD', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  for (const [width, height] of [[1440, 1100], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    const hint = await page.locator('#scene-hint').evaluate(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { x: rect.x, bottom: innerHeight - rect.bottom, height: rect.height,
        lineHeight: Number.parseFloat(style.lineHeight), align: style.textAlign,
        wrap: style.whiteSpace, events: style.pointerEvents };
    });
    expect(hint.x).toBe(12);
    expect(hint.bottom).toBe(28);
    expect(hint.height).toBeCloseTo(hint.lineHeight, 1);
    expect(hint.align).toBe('left'); expect(hint.wrap).toBe('nowrap');
    expect(hint.events).toBe('none');
  }
});

test('DS side stylus glows, picks up and draws tip-first with its back toward the camera', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const screenPointer = (x, y) => page.evaluate(async ({ x, y }) => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    const point = view.ds.screen.localToWorld(new Vector3(
      ((x + .5) / 256 - .5) * 4.5, (.5 - (y + .5) / 192) * 3.375, 0,
    )).project(view.camera), bounds = view.canvas.getBoundingClientRect();
    return { x: bounds.left + (point.x + 1) * bounds.width / 2,
      y: bounds.top + (1 - point.y) * bounds.height / 2 };
  }, { x, y });
  const tipPlacement = pointer => page.evaluate(async pointer => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    const pen = view.dsController.heldStylus;
    const tip = pen.getObjectByName('Stylus contact tip').getWorldPosition(new Vector3());
    const back = pen.localToWorld(new Vector3(0, 2.05, 0));
    const direction = back.clone().sub(tip).normalize();
    const towardCamera = view.camera.position.clone().sub(tip).normalize();
    const projected = tip.clone().project(view.camera), bounds = view.canvas.getBoundingClientRect();
    const dx = bounds.left + (projected.x + 1) * bounds.width / 2 - pointer.x;
    const dy = bounds.top + (1 - projected.y) * bounds.height / 2 - pointer.y;
    const end = back.project(view.camera);
    return { error: Math.hypot(dx, dy), facing: direction.dot(towardCamera),
      span: Math.hypot(end.x - projected.x, end.y - projected.y),
      visible: pen.visible, mapped: view.dsController.touchAt({ clientX: pointer.x, clientY: pointer.y }),
      held: view.dsController.stylusHeld };
  }, pointer);
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });
  await expect(page.locator('#select-ds')).toBeEnabled({ timeout: 90000 });
  const docked = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    const bounds = view.canvas.getBoundingClientRect();
    for (const y of [0, .6, -.6, 1.8]) for (const x of [.065, -.065, 0]) {
      const point = view.ds.stylus.localToWorld(new Vector3(x, y, .06)).project(view.camera);
      const event = { clientX: bounds.left + (point.x + 1) * bounds.width / 2,
        clientY: bounds.top + (1 - point.y) * bounds.height / 2 };
      if (view.pick(event)?.object.userData.dsStylus) return { x: event.clientX, y: event.clientY };
    }
    return null;
  });
  expect(docked, 'physical docked stylus is reachable on the desk').not.toBeNull();
  await page.mouse.move(docked.x, docked.y);
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { glow: view.ds.stylusGlow.visible, emitting: view.ds.stylusPlastic.emissiveIntensity > 0,
      buttonsBlack: view.ds.controls.get('a').mesh.material.emissive.getHex() === 0,
      mode: view.mode, transition: !!view.transition };
  })).toMatchObject({ glow: true, emitting: true, buttonsBlack: true });
  await page.screenshot({ path: testInfo.outputPath('ds-stylus-hover.png') });
  await page.mouse.click(docked.x, docked.y);
  await expect(page.locator('#scene')).toHaveAttribute('data-console', 'ds');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'held');
  await page.keyboard.press('Escape');
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await expect(page.locator('#ds-tools')).not.toBeVisible();
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await page.evaluate(async () => clearInterval((await import('./src/app.js')).view.dsController.autosave));
  await page.locator('#ds-stylus').click();
  const points = [[100, 90], [168, 152]];
  for (const [index, [x, y]] of points.entries()) {
    const pointer = await screenPointer(x, y);
    await page.mouse.move(pointer.x, pointer.y);
    if (!index) await page.mouse.down();
    await expect.poll(async () => (await framePixels(page, { x, y })).probe).toEqual([255, 255, 0]);
    await expect.poll(async () => (await tipPlacement(pointer)).error).toBeLessThan(.25);
    const pen = await tipPlacement(pointer);
    expect(pen.facing).toBeGreaterThan(.8);
    expect(pen.span).toBeLessThan(.25);
    expect(pen.visible && pen.held).toBe(true);
    expect(pen.mapped).toEqual({ x, y });
  }
  await page.screenshot({ path: testInfo.outputPath('ds-stylus-drawing.png') });
  await page.mouse.up();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'held');
  await page.mouse.click(100, 400, { button: 'right' });
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await page.locator('#ds-stylus').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'held');
  await page.locator('#ds-stylus').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await page.locator('#ds-stylus').click();
  const cancelPoint = await screenPointer(220, 40);
  await page.mouse.move(cancelPoint.x, cancelPoint.y);
  await page.mouse.down();
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: view.dsController.touchPointer }));
  });
  await page.mouse.up();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsController.touchPointer)).toBeUndefined();
  await page.locator('#ds-stylus').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Euler } = await import('three');
    view.ds.root.quaternion.setFromEuler(new Euler(.15, -.2, Math.PI));
    view.setDsHinge(155);
  });
  await page.locator('#ds-pose-lock').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#play-zoom').fill('65');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: false,
  });
  const button = await page.locator('#ds-stylus').boundingBox();
  expect(button.width).toBeGreaterThanOrEqual(44);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{
    id: 1, x: button.x + button.width / 2, y: button.y + button.height / 2,
  }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'held');
  const phonePointer = await screenPointer(44, 148);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, ...phonePointer }] });
  await expect.poll(async () => (await framePixels(page, { x: 44, y: 148 })).probe).toEqual([255, 255, 0]);
  await expect.poll(async () => (await tipPlacement(phonePointer)).error).toBeLessThan(.25);
  expect((await tipPlacement(phonePointer)).facing).toBeGreaterThan(.8);
  await page.screenshot({ path: testInfo.outputPath('ds-stylus-phone.png') });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.dsController.touchPointer)).toBeUndefined();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await page.locator('#ds-stylus').click();
  await page.locator('#ds-open').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await page.locator('#ds-close').click();
  await page.locator('#ds-stylus').click();
  await page.locator('#select-gba').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-stylus', 'docked');
  await expect(page.locator('#ds-stylus')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('DS independently articulates its hinge and locks a gameplay pose without changing the desk pose', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const pose = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { rotation: view.ds.root.quaternion.toArray(), hinge: view.dsHinge,
      locked: !!view.dsGameplayPose, desk: view.consolePoses.ds.position.toArray() };
  });
  const fits = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector2, Vector3 } = await import('three');
    return view.ds.screens.every(screen => [-2.2, 0, 2.2].every(x => [-1.65, 0, 1.65].every(y => {
      const point = screen.localToWorld(new Vector3(x, y, 0)).project(view.camera);
      view.raycaster.setFromCamera(new Vector2(point.x, point.y), view.camera);
      const hit = view.raycaster.intersectObjects([view.ds.root, view.pear.root], true)[0];
      return Math.abs(point.x) < .98 && Math.abs(point.y) < .95 && hit?.object === screen;
    })));
  });
  await page.goto('./');
  await expect(page.locator('#select-ds')).toBeEnabled();
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await pose()).rotation).toEqual([0, 0, 0, 1]);
  expect((await pose()).hinge).toBe(180);
  const desk = (await pose()).desk;
  await page.locator('#ds-hardware-power').click();
  await expect(page.locator('#ds-tools')).toBeVisible();
  await expect(page.locator('#ds-status')).toContainText('Insert a DS .nds cartridge');
  await page.locator('#ds-close').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  const canvas = page.locator('#scene-canvas');
  const rect = await canvas.boundingBox();
  await page.mouse.move(rect.x + rect.width * .6, rect.y + rect.height * .5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .6 + 30, rect.y + rect.height * .5 + 15, { steps: 4 });
  await page.mouse.up();
  const rotated = await pose();
  expect(rotated.rotation).not.toEqual([0, 0, 0, 1]);
  expect(rotated.hinge).toBe(180);
  await page.locator('#ds-inspect-action').selectOption('hinge');
  await page.mouse.move(rect.x + rect.width * .6, rect.y + rect.height * .5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .6, rect.y + rect.height * .5 + 100, { steps: 5 });
  await page.mouse.up();
  expect((await pose()).rotation).toEqual(rotated.rotation);
  expect((await pose()).hinge).toBeCloseTo(140);
  await canvas.focus();
  await page.keyboard.press('ArrowDown');
  expect((await pose()).hinge).toBeCloseTo(135);
  await page.locator('#ds-hinge').focus();
  await page.keyboard.press('Home');
  expect((await pose()).hinge).toBeCloseTo(30);
  await page.keyboard.press('End');
  expect((await pose()).hinge).toBe(180);
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowLeft');
  expect((await pose()).hinge).toBeCloseTo(140);
  const selected = await pose();
  await page.locator('#ds-pose-lock').click();
  await expect(page.locator('#ds-pose-lock')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#ds-hinge')).toBeDisabled();
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  expect((await pose()).rotation).toEqual(selected.rotation);
  await page.screenshot({ path: testInfo.outputPath('ds-hinge-inspect.png') });
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await pose()).rotation).toEqual(selected.rotation);
  expect((await pose()).hinge).toBeCloseTo(selected.hinge);
  expect(await fits()).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('ds-locked-playing.png') });
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  expect((await pose()).hinge).toBeCloseTo(110);
  expect((await pose()).desk).toEqual(desk);
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await pose()).rotation).toEqual(selected.rotation);
  expect((await pose()).hinge).toBeCloseTo(selected.hinge);
  await page.locator('#select-gba').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await expect(page.locator('#ds-inspect-controls')).toBeHidden();
  await expect(page.locator('#ds-hardware-power')).toBeHidden();
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await pose()).rotation).toEqual(selected.rotation);
  expect((await pose()).hinge).toBeCloseTo(selected.hinge);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await fits()).toBe(true);
  await expect(page.locator('#ds-hardware-power')).toBeVisible();
  const power = await page.locator('#ds-hardware-power').boundingBox();
  expect(power.width).toBeGreaterThanOrEqual(44);
  expect(power.height).toBeGreaterThanOrEqual(44);
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const point = view.project(view.ds.power), rect = view.canvas.getBoundingClientRect();
    const button = document.getElementById('ds-hardware-power').getBoundingClientRect();
    return Math.hypot(button.x + button.width / 2 - rect.x - point.x,
      button.y + button.height / 2 - rect.y - point.y);
  })).toBeLessThan(1);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  const panel = await page.locator('#ds-inspect-controls').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  expect(panel.y + panel.height).toBeLessThan(844);
  await page.screenshot({ path: testInfo.outputPath('ds-phone-pose-controls.png') });
  const cdp = await page.context().newCDPSession(page);
  const zoom = await page.evaluate(async () => (await import('./src/app.js')).view.zoom);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { id: 1, x: 120, y: 430 }, { id: 2, x: 270, y: 430 },
  ] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { id: 1, x: 90, y: 430 }, { id: 2, x: 300, y: 430 },
  ] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.zoom)).toBeLessThan(zoom);
  expect((await pose()).rotation).toEqual(selected.rotation);
  await cdp.detach();
  await page.locator('#ds-pose-lock').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('ArrowUp');
  expect((await pose()).hinge).toBeCloseTo(145);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect((await pose()).rotation).toEqual([0, 0, 0, 1]);
  expect((await pose()).hinge).toBe(180);
  expect(await fits()).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('ds-flat-default-phone.png') });
  await page.reload();
  await expect(page.locator('#select-ds')).toBeEnabled();
  expect((await pose()).locked).toBe(false);
  expect(errors).toEqual([]);
});

test('phone keeps both models on one table and DS LCDs and controls fit without reducing resolution', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#room-toggle').click();
  await page.locator('#room-toggle').blur();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: testInfo.outputPath('ds-phone-table.png') });
  const table = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    return {
      separate: view.ds.root !== view.model.root && view.ds.root.parent === view.model.root.parent,
      width: view.canvas.width, expected: Math.round(view.width * Math.min(devicePixelRatio, 2)),
      screens: [view.model.screen, ...view.ds.screens].map(screen => {
        const point = screen.getWorldPosition(new Vector3()).project(view.camera);
        return Math.abs(point.x) < 1 && Math.abs(point.y) < 1;
      }),
    };
  });
  expect(table.separate).toBe(true);
  expect(table.width).toBe(table.expected);
  expect(table.screens).toEqual([true, true, true]);
  expect(await stylusFits(page)).toBe(true);
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-cartridge', 'seated');
  await expect(page.locator('[data-ds-control=a]')).toBeVisible();
  const fits = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    return view.ds.screens.every(screen => [[-2.25, -1.6875], [2.25, 1.6875]].every(([x, y]) => {
      const point = new Vector3(x, y, 0); screen.localToWorld(point); point.project(view.camera);
      return Math.abs(point.x) < .96 && Math.abs(point.y) < .85;
    }));
  });
  expect(fits).toBe(true);
  expect(await stylusFits(page, .85)).toBe(true);
  const before = (await framePixels(page)).marker.left;
  await page.locator('[data-ds-control=right]').dispatchEvent('click', { detail: 0 });
  await expect.poll(async () => (await framePixels(page)).marker.left).toBeGreaterThan(before);
  await page.screenshot({ path: testInfo.outputPath('ds-phone-playing.png') });
});

test('DS placement clears props and pickup, inspection repaints live, and console branding follows selection', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#tools-open').click();
  const logo = page.locator('#tools > .panel-logo');
  await expect(logo).toHaveAttribute('src', './assets/logo.png');
  await expect(logo).toHaveAttribute('alt', 'BowserBOY Advance');
  expect(await logo.evaluate(img => img.complete && img.naturalWidth > 0 && img.getAnimations().length === 0)).toBe(true);
  await page.locator('#tools-close').click();
  const dockStyle = () => page.locator('#action-dock').evaluate(dock => {
    const style = getComputedStyle(dock);
    return { background: style.backgroundImage, border: style.borderColor };
  });
  const gbaDock = await dockStyle();
  const table = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3, Box3 } = await import('three');
    const footprint = mesh => {
      mesh.geometry.computeBoundingBox();
      const { min, max } = mesh.geometry.boundingBox;
      mesh.updateWorldMatrix(true, false);
      return [[min.x, min.y], [max.x, min.y], [max.x, max.y], [min.x, max.y]].map(([x, y]) => {
        const point = mesh.localToWorld(new Vector3(x, y, 0));
        return [point.x, point.z];
      });
    };
    const separated = (a, b) => [a, b].some(polygon => polygon.some(([x, y], i) => {
      const next = polygon[(i + 1) % polygon.length], axis = [next[1] - y, x - next[0]];
      const project = points => points.map(p => p[0] * axis[0] + p[1] * axis[1]);
      const pa = project(a), pb = project(b);
      return Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa);
    }));
    const base = view.ds.root.getObjectByName('Metallic blue control deck');
    const props = view.scene.children.flatMap(group => group.children.filter(child => child.name === 'Original cartridge prop'));
    const normal = new Vector3(0, 0, 1).transformDirection(view.ds.lid.matrixWorld);
    normal.y = 0; normal.normalize();
    const towardsLamp = view.lamp.light.getWorldPosition(new Vector3());
    towardsLamp.sub(view.ds.root.position); towardsLamp.y = 0; towardsLamp.normalize();
    const originalRender = view.renderer.render.bind(view.renderer);
    window.dsLiftSamples = [];
    view.renderer.render = (scene, camera) => {
      if (camera === view.camera && view.transition && view.console === 'ds') {
        window.dsLiftSamples.push(!new Box3().setFromObject(view.ds.root).intersectsBox(new Box3().setFromObject(view.model.root)));
      }
      return originalRender(scene, camera);
    };
    return { clear: props.map(prop => separated(footprint(base), footprint(prop))),
      facingLamp: normal.dot(towardsLamp), restingHeight: new Box3().setFromObject(view.ds.root).min.y };
  });
  expect(table.clear).toEqual([true, true, true]);
  expect(table.facingLamp).toBeGreaterThan(.6);
  expect(table.restingHeight).toBeGreaterThanOrEqual(-.01);
  expect(table.restingHeight).toBeLessThan(.02);
  const transparency = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const image = view.dsController.logo;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0, glow = 0, solid = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (!pixels[i]) transparent++;
      else if (pixels[i] < 240) glow++;
      else solid++;
    }
    return { size: [canvas.width, canvas.height], corners: [
      pixels[3], pixels[(canvas.width - 1) * 4 + 3],
      pixels[(canvas.height - 1) * canvas.width * 4 + 3], pixels.at(-1),
    ], transparent, glow, solid };
  });
  expect(transparency.size).toEqual([2149, 732]);
  expect(transparency.corners).toEqual([0, 0, 0, 0]);
  expect(transparency.transparent).toBeGreaterThan(10000);
  expect(transparency.glow).toBeGreaterThan(10000);
  expect(transparency.solid).toBeGreaterThan(10000);
  await page.locator('#room-toggle').click();
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect(await dockStyle()).not.toEqual(gbaDock);
  const clearance = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Box3, Vector3 } = await import('three');
    let radius = 0;
    view.ds.root.traverse(mesh => {
      if (!mesh.geometry) return;
      mesh.geometry.computeBoundingBox();
      const { min, max } = mesh.geometry.boundingBox;
      for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
        const point = view.ds.root.worldToLocal(mesh.localToWorld(new Vector3(x, y, z)));
        radius = Math.max(radius, point.length());
      }
    });
    const box = new Box3().setFromObject(view.model.root);
    return { samples: window.dsLiftSamples, rotationGap: box.distanceToPoint(view.ds.root.position) - radius };
  });
  expect(clearance.samples.length).toBeGreaterThan(1);
  expect(clearance.samples.every(Boolean), 'No DS/GBA bounding-box intersection during the actual lift').toBe(true);
  expect(clearance.rotationGap, 'Entire DS rotation envelope clears the GBA').toBeGreaterThan(.1);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect.poll(() => page.evaluate(async () => !(await import('./src/app.js')).view.changed)).toBe(true);
  const canvas = page.locator('#scene-canvas');
  const before = await canvas.screenshot();
  const quaternion = await page.evaluate(async () => (await import('./src/app.js')).view.model.root.quaternion.toArray());
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.width / 2, bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.width / 2 + 120, bounds.height / 2 + 30, { steps: 6 });
  await expect.poll(async () => (await canvas.screenshot()).equals(before), { message: 'DS must visibly rotate while the pointer is still held down' }).toBe(false);
  const midway = await canvas.screenshot();
  await page.mouse.move(bounds.width / 2 + 300, bounds.height / 2 + 50, { steps: 6 });
  await expect.poll(async () => (await canvas.screenshot()).equals(midway)).toBe(false);
  await page.mouse.up();
  await page.screenshot({ path: testInfo.outputPath('ds-reference-rear.png') });
  expect(await page.evaluate(async () => (await import('./src/app.js')).view.model.root.quaternion.toArray())).toEqual(quaternion);
  const dragged = await canvas.screenshot();
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await canvas.screenshot()).equals(dragged)).toBe(false);
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.lastRotation.equals(view.ds.root.quaternion);
  })).toBe(true);
  const surfaces = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3, Raycaster, Box3 } = await import('three');
    const hit = (point, direction) => {
      const origin = view.ds.lid.localToWorld(new Vector3(...point));
      const ray = new Vector3(...direction).transformDirection(view.ds.lid.matrixWorld);
      return new Raycaster(origin, ray).intersectObject(view.ds.lid, true)[0]?.object.name;
    };
    const stylus = new Box3().setFromObject(view.ds.stylus);
    const deck = new Box3().setFromObject(view.ds.root.getObjectByName('Metallic blue control deck'));
    view.renderer.render(view.scene, view.camera);
    const cyan = [[-3.0, -3.4, .25], [3.7, -3.1, .25]].map(position => {
      const point = view.ds.root.localToWorld(new Vector3(...position)).project(view.camera);
      const gl = view.renderer.getContext(), rgba = new Uint8Array(4);
      gl.readPixels(Math.round((point.x + 1) * view.canvas.width / 2), Math.round((point.y + 1) * view.canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return [...rgba].slice(0, 3);
    });
    return { front: hit([0, .37, 1], [0, 0, -1]), rear: hit([0, 2.43, -1], [0, 0, 1]),
      dockGap: stylus.min.x - deck.max.x, withinBase: stylus.min.y > deck.min.y && stylus.max.y < deck.max.y, cyan };
  });
  expect(surfaces.front).not.toContain('emblem');
  expect(surfaces.rear).toBe('Supplied transparent DS rear emblem');
  expect(surfaces.dockGap).toBeLessThan(.15);
  expect(surfaces.withinBase).toBe(true);
  for (const [red, green, blue] of surfaces.cyan) {
    expect(blue).toBeGreaterThan(green * 1.05);
    expect(green).toBeGreaterThan(red * 1.3);
    expect(blue).toBeGreaterThan(35);
  }
  await page.screenshot({ path: testInfo.outputPath('ds-reference-front.png') });
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  const returned = await page.evaluate(() => window.dsLiftSamples);
  expect(returned.length).toBeGreaterThan(clearance.samples.length);
  expect(returned.every(Boolean), 'The return motion also clears the GBA').toBe(true);
  await page.screenshot({ path: testInfo.outputPath('ds-reference-table.png') });
  await page.locator('#room-toggle').click();
  await page.screenshot({ path: testInfo.outputPath('ds-reference-table-warm.png') });
  await page.locator('#select-gba').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect(await dockStyle()).toEqual(gbaDock);
  expect(errors).toEqual([]);
});

test('DS shell retains bright blue-cyan in its reference lighting pose under warm companion light and room light', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#select-ds').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });

  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Euler } = await import('three');
    view.ds.root.quaternion.setFromEuler(new Euler(-.45, -.18, 0));
    view.setDsHinge(110);
    view.setDsPoseLocked(true);
  });
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');

  // Preserve the original photometric reference independently of editable gameplay poses.
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Vector3 } = await import('three');
    view.ds.root.position.set(10.3, 5.1, 8);
    view.lookAt.copy(view.ds.root.position).add(new Vector3(.15, -.5, 0));
    const tangent = Math.tan(view.camera.fov * Math.PI / 360);
    const distance = Math.max(12 / view.camera.aspect, 9.8 * view.height / (view.height - 180)) / (2 * tangent);
    view.camera.position.copy(view.lookAt).add(new Vector3(0, 0, distance));
    view.dsReflectionsDirty = view.changed = true;
  });
  for (const lighting of ['warm', 'room']) {
    if (lighting === 'room') await page.locator('#room-toggle').click();
    await expect.poll(() => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      return view.transition === null && view.screenIllumination.settled && !view.dsReflectionsDirty;
    })).toBe(true);
    const surfaces = await page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      const { Vector2, Vector3, Raycaster } = await import('three');
      const shell = view.ds.root.getObjectByName('Metallic blue control deck').material;
      const lidShell = view.ds.root.getObjectByName('Metallic blue recessed inner lid').material;
      const gl = view.renderer.getContext(), ray = new Raycaster();
      view.renderer.render(view.scene, view.camera);
      const sample = () => [
        [view.ds.lid, [[-3.4, 2.4, .15], [3.4, 2.4, .15], [-3.4, 3.8, .15], [3.4, 3.8, .15]]],
        [view.ds.root, [[-3, -3.4, .25], [3.7, -3.1, .25], [-3, -4.2, .25], [3.7, -4.2, .25]]],
      ].map(([parent, points]) => {
        const samples = points.map(position => {
          const point = parent.localToWorld(new Vector3(...position)).project(view.camera);
          ray.setFromCamera(new Vector2(point.x, point.y), view.camera);
          const hit = ray.intersectObjects(view.scene.children, true)[0];
          const rgba = new Uint8Array(4);
          gl.readPixels(Math.round((point.x + 1) * view.canvas.width / 2),
            Math.round((point.y + 1) * view.canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
          return { shell: hit?.object.material === (parent === view.ds.lid ? lidShell : shell),
            rgb: [...rgba].slice(0, 3) };
        });
        return { visibleShell: samples.every(sample => sample.shell),
          mean: [0, 1, 2].map(channel => samples.reduce((sum, sample) => sum + sample.rgb[channel], 0) / samples.length) };
      });
      const surfaces = sample(), color = shell.color.clone();
      try {
        shell.color.copy(lidShell.color);
        view.renderer.render(view.scene, view.camera);
        surfaces[1].darkerMean = sample()[1].mean;
      } finally {
        shell.color.copy(color);
        view.renderer.render(view.scene, view.camera);
      }
      return surfaces;
    });
    for (const [index, surface] of surfaces.entries()) {
      expect(surface.visibleShell, `${lighting}: sample shell, not screens, controls or props`).toBe(true);
      const [red, green, blue] = surface.mean;
      expect(blue, `${lighting}: blue must exceed green`).toBeGreaterThan(green * 1.05);
      expect(green, `${lighting}: retain cyan rather than violet`).toBeGreaterThan(red * 1.3);
      expect(blue, `${lighting}: visibly brighter ${index === 0 ? 'lid' : 'deck'}`)
        .toBeGreaterThan(lighting === 'warm' ? (index === 0 ? 100 : 30) : (index === 0 ? 140 : 60));
    }
    const luminance = rgb => rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    expect(luminance(surfaces[1].mean), `${lighting}: lighter NDS base in the same lighting`)
      .toBeGreaterThan(luminance(surfaces[1].darkerMean) * 1.15);
    await page.screenshot({ path: testInfo.outputPath(`ds-blue-cyan-${lighting}.png`) });
  }
});

test('DS CDN failure is visible and retryable without replacing the GBA, including reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://cdn.emulatorjs.org/**', route => route.abort('failed'));
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#select-ds').click();
  await page.locator('#ds-open').click();
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('CDN could not be reached');
  await expect(page.locator('#ds-tools')).toBeVisible();
  await expect(page.locator('#ds-demo')).toBeEnabled();
  await expect(page.locator('#ds-save')).toBeDisabled();
  await expect(page.locator('#ds-runtime-mount iframe')).toHaveCount(0);
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-cartridge', 'seated');
  await page.unroute('https://cdn.emulatorjs.org/**');
  await page.locator('#ds-demo').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  expect((await framePixels(page)).size).toEqual([256, 384]);
});
