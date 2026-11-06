import { test, expect } from '@playwright/test';
import { demoReady, powerOn } from './pixel-lab.mjs';

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
const framePixels = async page => (await dsFrame(page)).evaluate(async () => {
  const png = await window.EJS_emulator.gameManager.screenshot();
  const bitmap = await createImageBitmap(new Blob([png], { type: 'image/png' }));
  const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const pixel = (x, y) => [...data.slice((y * bitmap.width + x) * 4, (y * bitmap.width + x) * 4 + 3)];
  const find = (color, start, end) => {
    let left = bitmap.width, top = end, count = 0;
    for (let y = start; y < end; y++) for (let x = 0; x < bitmap.width; x++) {
      if (pixel(x, y).every((value, i) => Math.abs(value - color[i]) < 10)) { count++; left = Math.min(left, x); top = Math.min(top, y); }
    }
    return { left, top, count };
  };
  const result = {
    size: [bitmap.width, bitmap.height], top: pixel(0, 0), bottom: pixel(0, 192),
    marker: find([222, 214, 49], 75, 155), touch: find([255, 255, 0], 257, 353),
  };
  bitmap.close(); return result;
});

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
  await page.locator('#ds-open').click();
  await page.locator('#ds-power').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-ds-power', 'off');
  await expect(page.locator('#ds-runtime-mount iframe')).toHaveCount(0);
  await page.locator('#ds-power').click();
  await expect(page.locator('#ds-status')).toContainText('DS cartridge running', { timeout: 90000 });
  await expect.poll(async () => (await framePixels(page)).marker.left).toBe(120);
  expect(await gba.evaluate(() => window.EJS_emulator.paused)).toBe(true);
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
    const teal = [[-3.0, -3.4, .25], [3.7, -3.1, .25]].map(position => {
      const point = view.ds.root.localToWorld(new Vector3(...position)).project(view.camera);
      const gl = view.renderer.getContext(), rgba = new Uint8Array(4);
      gl.readPixels(Math.round((point.x + 1) * view.canvas.width / 2), Math.round((point.y + 1) * view.canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return [...rgba].slice(0, 3);
    });
    return { front: hit([0, .37, 1], [0, 0, -1]), rear: hit([0, 2.43, -1], [0, 0, 1]),
      dockGap: stylus.min.x - deck.max.x, withinBase: stylus.min.y > deck.min.y && stylus.max.y < deck.max.y, teal };
  });
  expect(surfaces.front).not.toContain('emblem');
  expect(surfaces.rear).toBe('Supplied transparent DS rear emblem');
  expect(surfaces.dockGap).toBeLessThan(.15);
  expect(surfaces.withinBase).toBe(true);
  for (const [red, green, blue] of surfaces.teal) {
    expect(green).toBeGreaterThan(red * 1.35);
    expect(blue).toBeGreaterThan(red * 1.1);
    expect(green).toBeGreaterThan(blue * .9);
    expect(blue).toBeGreaterThan(green * .35);
    expect(green).toBeGreaterThan(12);
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
