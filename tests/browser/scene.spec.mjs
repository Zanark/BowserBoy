import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { demoReady, powerOn } from './pixel-lab.mjs';

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

const surfaceColor = (page, position, lcdIntensity) => page.evaluate(async ({ point, lcdIntensity }) => {
  const { view } = await import('./src/app.js');
  const { Vector3 } = await import('three');
  const previousIntensity = view.screenIllumination.light.intensity;
  try {
    if (lcdIntensity !== undefined) view.screenIllumination.light.intensity = lcdIntensity;
    view.renderer.render(view.scene, view.camera);
  } finally { view.screenIllumination.light.intensity = previousIntensity; }
  const projected = new Vector3(...point).project(view.camera);
  const { width, height } = view.canvas;
  const x = Math.round((projected.x + 1) * width / 2);
  const y = Math.round((projected.y + 1) * height / 2);
  if (x < 2 || y < 2 || x > width - 3 || y > height - 3) throw new Error('Lighting probe is outside the actual render.');
  const gl = view.renderer.getContext();
  const pixels = new Uint8Array(5 * 5 * 4);
  gl.readPixels(x - 2, y - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const total = [0, 0, 0];
  for (let i = 0; i < pixels.length; i += 4) for (let channel = 0; channel < 3; channel++) total[channel] += pixels[i + channel];
  return total.map(channel => channel / 25);
}, { point: position, lcdIntensity });
const surfaceLight = async (page, position, lcdIntensity) =>
  (await surfaceColor(page, position, lcdIntensity)).reduce((a, b) => a + b) / 3;

for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
  test(`physical cartridge slides into the top slot during real loading at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      window.cartridgeSamples = [];
      new MutationObserver(async changes => {
        if (!changes.some(change => change.target.dataset.cartridge === 'inserting')) return;
        const { view } = await import('./src/app.js');
        const { Box3, Vector3 } = await import('three');
        const sample = () => {
          const cartridge = view.model.cartridge;
          cartridge.updateWorldMatrix(true, true);
          const box = new Box3().setFromObject(cartridge), points = [];
          for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
            points.push(new Vector3(x, y, z).project(view.camera));
          }
          window.cartridgeSamples.push({
            time: performance.now(),
            y: cartridge.position.y, visible: cartridge.visible,
            fits: points.every(point => Math.abs(point.x) < 1 && Math.abs(point.y) < .9),
            lowered: view.model.root.position.y < 2.65,
            clearsTable: new Box3().setFromObject(view.model.root).min.y > 0,
          });
          if (view.cartridgeMotion) requestAnimationFrame(sample);
        };
        sample();
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-cartridge'] });
    });
    let release;
    let download = new Promise(resolve => { release = resolve; });
    await page.route('https://cdn.emulatorjs.org/4.2.3/data/loader.js', async route => {
      await download;
      await route.continue();
    });
    try {
      await page.goto('./');
      await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
      await page.locator('#pickup').click();
      await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
      await powerOn(page);
      await expect(page.locator('#hardware-power')).toBeEnabled();
      await page.locator('#tools-open').click();
      await page.locator('#demo').click();
      await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'inserting');
      await expect(page.locator('#loading-screen')).toHaveJSProperty('hidden', false);
      try {
        await expect.poll(() => page.evaluate(() => window.cartridgeSamples.some(sample =>
          sample.visible && sample.fits && sample.lowered && sample.y > 3))).toBe(true);
      } finally {
        await testInfo.attach('cartridge-motion-samples', {
          body: JSON.stringify(await page.evaluate(() => window.cartridgeSamples)), contentType: 'application/json',
        });
      }
      await page.screenshot({ path: testInfo.outputPath('cartridge-inserting.png') });
      await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
      const positions = await page.evaluate(() => window.cartridgeSamples.map(sample => sample.y));
      expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(2);
      expect(positions.every((value, index) => !index || value <= positions[index - 1])).toBe(true);
      expect(await page.evaluate(() => window.cartridgeSamples.every(sample => sample.clearsTable))).toBe(true);
      await expect(page.locator('#pause')).toBeDisabled();
      await expect(page.locator('#loading-screen')).toHaveJSProperty('hidden', false);
      release();
      await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
      await demoReady(page);
      const attached = await page.evaluate(async () => {
        const { view } = await import('./src/app.js');
        return view.model.cartridge.visible && view.model.cartridge.parent === view.model.root &&
          view.cartridgeMotion === null;
      });
      expect(attached).toBe(true);
      await expect.poll(() => page.evaluate(async () => {
        const { view } = await import('./src/app.js');
        return !view.cameraMotion && view.model.root.position.y === 3.5;
      })).toBe(true);
      if (viewport.width === 1440) {
        page.on('dialog', dialog => dialog.accept());
        download = new Promise(resolve => { release = resolve; });
        await page.reload();
        await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'inserting');
        await expect(page.locator('#scene')).not.toHaveAttribute('data-booting', 'true');
        await expect.poll(() => page.evaluate(() => window.cartridgeSamples.some(sample =>
          sample.visible && sample.fits && sample.lowered && sample.y > 3))).toBe(true);
        await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
        await expect(page.locator('#loading-screen')).toHaveJSProperty('hidden', false);
        release();
        await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
        await demoReady(page);
      }
    } finally { release(); }
  });
}

test('dark room has a working physical lamp, actual light falloff and a narrow accessible toolbar', async ({ page }) => {
  await page.goto('./');
  await expect.poll(async () => (await sceneState(page))?.triangles).toBeGreaterThan(1000);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.screenIllumination.settled)).toBe(true);
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return !view.changed && !view.renderer.shadowMap.needsUpdate;
  })).toBe(true);
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const render = view.renderer.render.bind(view.renderer);
    window.idleDraws = 0;
    view.renderer.render = (...args) => { window.idleDraws++; return render(...args); };
  });
  await page.waitForTimeout(150);
  const idleDraws = await page.evaluate(() => window.idleDraws);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.idleDraws), 'A static table must not repeatedly redraw or read back its LCD').toBe(idleDraws);
  const lit = await surfaceLight(page, [0, 0, 4]);
  expect(lit).toBeGreaterThan(20);
  await page.locator('#lamp-toggle').click();
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => surfaceLight(page, [0, 0, 4])).toBeLessThan(lit * .15);
  const switchPoint = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.project(view.lamp.switchCap);
  });
  await page.mouse.click(switchPoint.x, switchPoint.y);
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  expect(await surfaceLight(page, [0, 0, 4])).toBeGreaterThan(lit * .9);
  for (const [width, height] of [[320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.locator('#pickup').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    const fits = await page.locator('.scene-actions').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth;
    });
    expect(fits).toBe(true);
    await page.locator('#lamp-toggle').click();
    await expect(page.locator('#lamp-toggle')).toBeVisible();
    await page.locator('#put-down').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  }
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.screenIllumination.settled)).toBe(true);
  const budgets = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
    const tick = (milliseconds) => {
      view.changed = true;
      view.render(view.lastRender + milliseconds);
    };
    return [1, 2].map(ratio => {
      view.renderer.setPixelRatio(ratio);
      view.setControl('a', false);
      view.renderedLastFrame = false;
      view.nextPaint = 0;
      tick(16);
      const beforeRecovery = view.renderer.info.render.frame;
      tick(100);
      const duringRecovery = view.renderer.info.render.frame;
      tick(201); tick(16);
      const singleStallRatio = view.renderer.getPixelRatio();
      tick(1000); tick(201);
      const severeStallRatio = view.renderer.getPixelRatio();
      for (let i = 0; i < 6; i++) { tick(100); tick(201); }
      const beforeIdle = view.renderer.info.render.frame;
      view.render(view.lastRender + 1000);
      view.render(view.lastRender + 201);
      const afterIdle = view.renderer.info.render.frame;
      view.setControl('a', true);
      tick(100);
      return { ratio, singleStallRatio, severeStallRatio, beforeRecovery, duringRecovery, beforeIdle, afterIdle, slowRatio: view.renderer.getPixelRatio(),
        width: view.canvas.width, cssWidth: view.width, press: view.model.controls.get('a').mesh.userData.motion.press };
    });
  });
  for (const budget of budgets) {
    expect(budget.singleStallRatio).toBe(budget.ratio);
    expect(budget.severeStallRatio, 'Scheduling stalls must never reduce handheld sharpness').toBe(budget.ratio);
    expect(budget.afterIdle, 'A severe scheduling gap must not wake a settled, idle scene').toBe(budget.beforeIdle);
    expect(budget.duringRecovery).toBe(budget.beforeRecovery);
    expect(budget.slowRatio, 'Sustained slow frames must retain full resolution').toBe(budget.ratio);
    expect(budget.width).toBe(Math.floor(budget.cssWidth * budget.ratio));
    expect(budget.press).toBeGreaterThan(.99);
  }
  const playingRecovery = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const tick = gap => { view.changed = true; view.render(view.lastRender + gap); };
    view.setView('playing');
    view.renderedLastFrame = false;
    view.nextPaint = 0;
    view.lastRender = performance.now();
    tick(1000);
    const before = view.renderer.info.render.frame;
    tick(1000); tick(201);
    const during = view.renderer.info.render.frame;
    tick(800);
    return { before, during, after: view.renderer.info.render.frame, ratio: view.renderer.getPixelRatio() };
  });
  expect(playingRecovery.during, 'A stalled, stationary handheld must leave time for the native core').toBe(playingRecovery.before);
  expect(playingRecovery.after).toBeGreaterThan(playingRecovery.before);
  expect(playingRecovery.ratio).toBe(2);
  const insertion = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const render = view.renderer.render.bind(view.renderer);
    const presented = [];
    view.renderer.render = (...args) => {
      render(...args);
      presented.push(view.model.cartridge.position.y);
    };
    try {
      view.insertCartridge('presented-clock-regression');
      view.renderedLastFrame = false;
      view.nextPaint = 0;
      for (let frame = 0; frame < 6; frame++) {
        view.render(view.lastRender + 1000);
        view.render(view.lastRender + 201);
      }
      return { presented, state: view.host.dataset.cartridge, ratio: view.renderer.getPixelRatio() };
    } finally { view.renderer.render = render; }
  });
  expect(insertion.presented[0]).toBe(3.8);
  expect(insertion.presented.some(y => y > 1.52 && y < 3.8)).toBe(true);
  expect(insertion.presented.at(-1), 'The finishing paint must present the seated pose, not the previous clock step').toBe(1.52);
  expect(insertion.state).toBe('seated');
  expect(insertion.ratio).toBe(2);
  const nativeOperation = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const before = view.renderer.info.render.frame;
    view.nativeBusy = true;
    view.changed = true;
    view.renderedLastFrame = false;
    view.nextPaint = 0;
    view.render(view.lastRender + 16);
    const during = view.renderer.info.render.frame;
    view.nativeBusy = false;
    view.render(view.lastRender + 16);
    return { before, during, after: view.renderer.info.render.frame, ratio: view.renderer.getPixelRatio() };
  });
  expect(nativeOperation.during, 'Room paints must yield while a native operation is pending').toBe(nativeOperation.before);
  expect(nativeOperation.after).toBeGreaterThan(nativeOperation.before);
  expect(nativeOperation.ratio).toBe(2);
});

test('paper lantern gives warm light and room lights switch independently without powering the console', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'true');
  const color = await surfaceColor(page, [0, 0, 4]);
  expect(color[0]).toBeGreaterThan(color[1] * 1.1);
  expect(color[1]).toBeGreaterThan(color[2] * 1.1);
  const shape = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Box3, Vector3 } = await import('three');
    const shade = view.lamp.shade;
    const lampSize = new Box3().setFromObject(view.lamp.root).getSize(new Vector3());
    const shell = view.model.root.getObjectByName('Front shell');
    shell.geometry.computeBoundingBox();
    const shellSize = shell.geometry.boundingBox.getSize(new Vector3());
    return { type: shade.geometry.type, top: shade.geometry.parameters.radiusTop,
      bottom: shade.geometry.parameters.radiusBottom, wood: !!view.lamp.root.getObjectByName('Wooden lamp base'),
      heightRatio: lampSize.y / shellSize.x, handheldScale: view.model.root.scale.toArray() };
  });
  expect(shape.type).toBe('CylinderGeometry');
  expect(shape.top).toBe(shape.bottom);
  expect(shape.wood).toBe(true);
  expect(shape.heightRatio).toBeGreaterThan(3.9);
  expect(shape.heightRatio).toBeLessThan(4.1);
  expect(shape.handheldScale).toEqual([1, 1, 1]);
  for (const [width, height] of [[390, 844], [1440, 1100]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      const { Box3, Raycaster, Vector2, Vector3 } = await import('three');
      const surfaces = ['Wooden tabletop', 'Warm plaster room wall', 'Room floor'].map(name => view.scene.getObjectByName(name));
      const ray = new Raycaster();
      const covered = [-.99, -.5, 0, .5, .99].every(x => [-.99, -.5, 0, .5, .99].every(y => {
        ray.setFromCamera(new Vector2(x, y), view.camera);
        return ray.intersectObjects(surfaces).length > 0;
      }));
      const box = new Box3().setFromObject(view.model.root), points = [];
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) points.push(new Vector3(x, y, z).project(view.camera).x);
      }
      const handheldWidth = (Math.max(...points) - Math.min(...points)) / 2;
      const table = surfaces[0], floor = surfaces[2];
      ray.setFromCamera(new Vector2(.9, -.95), view.camera);
      const below = ray.intersectObjects(surfaces)[0];
      const thickTable = table.geometry.parameters.height >= 2 &&
        table.position.y - table.geometry.parameters.height / 2 > floor.position.y + 20;
      const openBelow = below && below.object !== table && below.point.y < -2.4;
      return { covered, closerHandheld: handheldWidth > .18, thickTable, openBelow: !!openBelow };
    })).toEqual({ covered: true, closerHandheld: true, thickTable: true, openBelow: true });
  }
  await page.screenshot({ path: testInfo.outputPath('cozy-lantern-table.png') });
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const playSurround = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector2 } = await import('three');
    const surfaces = ['Wooden tabletop', 'Warm plaster room wall', 'Room floor'].map(name => view.scene.getObjectByName(name));
    const ray = new Raycaster();
    return [-.99, .99].every(x => [-.99, 0, .99].every(y => {
      ray.setFromCamera(new Vector2(x, y), view.camera);
      return ray.intersectObjects(surfaces).length > 0;
    }));
  });
  expect(playSurround).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('cozy-lantern-playing.png') });
  await page.locator('#lamp-toggle').click();
  await expect.poll(() => surfaceLight(page, [0, 0, -2])).toBeLessThan(1);
  await page.locator('#room-toggle').click();
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => surfaceLight(page, [0, 0, -2])).toBeGreaterThan(20);
  await expect(page.locator('#hardware-power')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('room-lights-on.png') });
  await page.locator('#lamp-toggle').click();
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#room-toggle').click();
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('larger LCD halves bezel gaps and the underside power slider works at desktop and phone sizes', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const layout = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.setScreenCurve(false);
    const screen = view.model.screen, bezel = view.model.root.getObjectByName('Charcoal bezel');
    screen.geometry.computeBoundingBox();
    bezel.geometry.computeBoundingBox();
    const s = screen.geometry.boundingBox.clone().translate(screen.position);
    const b = bezel.geometry.boundingBox.clone().translate(bezel.position);
    return { aspect: (s.max.x - s.min.x) / (s.max.y - s.min.y),
      width: s.max.x - s.min.x, side: b.max.x - s.max.x,
      top: b.max.y - s.max.y, bottom: s.min.y - b.min.y,
      emitterWidth: view.screenIllumination.light.width, emitterHeight: view.screenIllumination.light.height };
  });
  expect(layout.width).toBeGreaterThan(3.68);
  expect(layout.aspect).toBeCloseTo(1.5, 5);
  expect(layout.side).toBeCloseTo(.37 / 2, 2);
  expect(layout.top).toBeCloseTo(.398333 / 2, 2);
  expect(layout.bottom).toBeCloseTo(.878333 / 2, 2);
  expect(layout.emitterWidth).toBeCloseTo(layout.width, 5);
  expect(layout.emitterHeight).toBeCloseTo(layout.width / 1.5, 5);
  await page.evaluate(async () => (await import('./src/app.js')).view.setScreenCurve(true));
  for (const [width, height] of [[1920, 1080], [1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    if (await page.locator('#notice').isVisible()) await page.locator('#notice-dismiss').click();
    const target = page.locator('#hardware-power');
    await expect(target).toBeInViewport({ ratio: 1 });
    await expect.poll(() => target.evaluate(element => {
      const box = element.getBoundingClientRect();
      return box.width >= 44 && box.height >= 44;
    })).toBe(true);
    await expect.poll(() => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      const { Box3, Raycaster, Vector3 } = await import('three');
      const power = view.model.controls.get('power').mesh;
      const center = power.localToWorld(new Vector3(0, 0, .055));
      const direction = center.clone().sub(view.camera.position).normalize();
      const hit = new Raycaster(view.camera.position, direction).intersectObject(view.model.root, true)[0];
      let part = hit?.object;
      while (part && part !== power) part = part.parent;
      const point = view.project(power), screen = view.model.screen;
      screen.updateWorldMatrix(true, false);
      const { width, height } = screen.geometry.userData.viewport;
      const corners = [[-1, -1], [1, 1]].map(([x, y]) =>
        screen.localToWorld(new Vector3(x * width / 2, y * height / 2, 0)).project(view.camera));
      const bottom = (1 - Math.min(...corners.map(p => p.y))) * view.height / 2;
      const target = document.querySelector('#hardware-power').getBoundingClientRect();
      const toolbar = document.querySelector('.scene-actions').getBoundingClientRect();
      const headerImage = document.querySelector('.desk-heading h1 img');
      const header = headerImage.getBoundingClientRect();
      const mask = document.createElement('canvas');
      mask.width = 217; mask.height = 73;
      const context = mask.getContext('2d');
      if (getComputedStyle(headerImage).visibility === 'visible') {
        context.drawImage(headerImage, 0, 0, mask.width, mask.height);
      }
      const alpha = context.getImageData(0, 0, mask.width, mask.height).data;
      const shell = view.model.root.getObjectByName('Front shell');
      const viewport = [];
      view.model.root.traverseVisible(mesh => {
        const positions = mesh.geometry?.getAttribute('position');
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
          const point = mesh.localToWorld(new Vector3().fromBufferAttribute(positions, i)).project(view.camera);
          viewport.push({ x: (point.x + 1) * view.width / 2, y: (1 - point.y) * view.height / 2 });
        }
      });
      // Check real artwork against projected geometry, not transparent image padding.
      context.clearRect(0, 0, mask.width, mask.height);
      context.fillStyle = 'white';
      for (const mesh of [shell, ...['l', 'r'].map(id => view.model.controls.get(id).mesh)]) {
        const positions = mesh.geometry.getAttribute('position');
        const projected = [];
        for (let i = 0; i < positions.count; i++) {
          const point = mesh.localToWorld(new Vector3().fromBufferAttribute(positions, i)).project(view.camera);
          const x = (point.x + 1) * view.width / 2, y = (1 - point.y) * view.height / 2;
          projected.push([(x - header.left) / header.width * mask.width, (y - header.top) / header.height * mask.height]);
        }
        const index = mesh.geometry.index;
        const count = index?.count ?? positions.count;
        for (let i = 0; i < count; i += 3) {
          const triangle = [0, 1, 2].map(offset => projected[index ? index.getX(i + offset) : i + offset]);
          if (triangle.every(([x]) => x < 0) || triangle.every(([x]) => x > mask.width) ||
            triangle.every(([, y]) => y < 0) || triangle.every(([, y]) => y > mask.height)) continue;
          context.beginPath();
          context.moveTo(...triangle[0]);
          context.lineTo(...triangle[1]);
          context.lineTo(...triangle[2]);
          context.closePath();
          context.fill();
        }
      }
      const coverage = context.getImageData(0, 0, mask.width, mask.height).data;
      let clearHeader = true;
      for (let i = 3; i < alpha.length; i += 4) {
        if (alpha[i] > 24 && coverage[i] > 24) { clearHeader = false; break; }
      }
      const oldDistance = Math.max(10.2 / view.camera.aspect, 5.55 *
        view.height / Math.max(160, view.height - 180)) / (2 * Math.tan(view.camera.fov * Math.PI / 360));
      const inverse = view.model.root.matrixWorld.clone().invert();
      const bounds = new Box3().setFromObject(power).applyMatrix4(inverse);
      const normal = new Vector3(0, 0, 1).transformDirection(power.matrixWorld).transformDirection(inverse);
      return { exposed: part === power, belowLcd: target.top > bottom,
        fits: toolbar.left >= 0 && toolbar.right <= innerWidth,
        clearToolbar: target.bottom <= toolbar.top,
        closer: view.camera.position.z < oldDistance * .98,
        wholeHandheld: viewport.every(p => p.x >= 4 && p.x <= innerWidth - 4 && p.y >= 4 && p.y < toolbar.top),
        clearHeader,
        underside: bounds.max.y < -2.25 && bounds.min.z > -.4 && bounds.max.z < .4 &&
          normal.y < -.95 && Math.abs(normal.z) < .05,
        followsCap: Math.abs(target.left + target.width / 2 - point.x) < 1 &&
          Math.abs(target.top + target.height / 2 - point.y) < 1 };
    }), { message: `Underside placement, visible cap, LCD/dock clearance and following target at ${width}x${height}` }).toEqual({
      underside: true, exposed: true, belowLcd: true, fits: true, clearToolbar: true, followsCap: true,
      closer: true, wholeHandheld: true, clearHeader: true,
    });
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await expect(target).toBeEnabled();
    expect(await page.evaluate(async () =>
      (await import('./src/app.js')).view.model.controls.get('power').mesh.position.x)).toBe(.1);
    await page.screenshot({ path: testInfo.outputPath(`visible-power-${width}.png`) });
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(async () =>
      (await import('./src/app.js')).view.model.controls.get('power').mesh.position.x)).toBe(-.1);
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('#notice-dismiss').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect(page.locator('#hardware-power')).toBeHidden();
  await page.locator('#scene-canvas').focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const power = view.model.controls.get('power').mesh;
    power.updateWorldMatrix(true, false);
    return new Vector3(0, 0, 1).transformDirection(power.matrixWorld)
      .dot(view.camera.position.clone().sub(power.getWorldPosition(new Vector3())).normalize());
  })).toBeGreaterThan(.5);
  await page.locator('#room-toggle').click();
  await page.screenshot({ path: testInfo.outputPath('underside-power-detail.png') });
});

test('pressed caps remain lit inside physical shell apertures instead of disappearing under socket lids', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
    view.renderer.setPixelRatio(1);
  });
  const openings = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const root = view.model.root, face = root.getObjectByName('Front face with speaker apertures');
    face.geometry.computeBoundingBox();
    root.updateWorldMatrix(true, true);
    const top = face.position.z + face.geometry.boundingBox.max.z;
    return [['a', .304, 0], ['b', .304, 0], ['start', .17, 0], ['select', .17, 0], ['up', .644, 0]]
      .map(([id, x, y]) => {
        const mesh = view.model.controls.get(id).mesh;
        const origin = root.localToWorld(new Vector3(mesh.position.x + x, mesh.position.y + y, 2));
        const direction = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
        const hit = new Raycaster(origin, direction).intersectObject(root, true)[0];
        return { id, recessed: !!hit && root.worldToLocal(hit.point.clone()).z < top - .015 };
      });
  });
  for (const { id, recessed } of openings) expect(recessed, `${id} has a recessed opening, not a raised socket lid`).toBe(true);
  const sample = (id, pressed) => page.evaluate(async ({ id, pressed }) => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    view.setControl(id, pressed);
    view.changed = true;
    view.nextPaint = 0;
    view.renderedLastFrame = false;
    view.render(view.lastRender + 250);
    const mesh = view.model.controls.get(id).mesh;
    const points = ['up', 'down', 'left', 'right'].includes(id) ?
      [[0, .48, .05], [0, -.48, .05], [-.48, 0, .05], [.48, 0, .05]] :
      ['start', 'select'].includes(id) ?
        [[-.05, .04, .05], [.05, .04, .05], [-.05, -.04, .05], [.05, -.04, .05]] :
        [[-.11, .10, .05], [.11, .10, .05], [-.11, -.10, .05], [.11, -.10, .05]];
    const gl = view.renderer.getContext(), values = [];
    for (const point of points) {
      const projected = mesh.localToWorld(new Vector3(...point)).project(view.camera);
      const x = Math.round((projected.x + 1) * view.canvas.width / 2);
      const y = Math.round((projected.y + 1) * view.canvas.height / 2);
      const pixels = new Uint8Array(5 * 5 * 4);
      gl.readPixels(x - 2, y - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let total = 0;
      for (let i = 0; i < pixels.length; i += 4) total += pixels[i] + pixels[i + 1] + pixels[i + 2];
      values.push(total / 75);
    }
    return values;
  }, { id, pressed });
  const readings = [];
  for (const id of ['a', 'b', 'up', 'down', 'left', 'right', 'start', 'select']) {
    const rest = await sample(id, false);
    const pressed = await sample(id, true);
    readings.push({ id, rest, pressed });
    if (['a', 'up'].includes(id)) await page.screenshot({ path: testInfo.outputPath(`${id}-pressed.png`) });
    await sample(id, false);
  }
  await testInfo.attach('pressed-light-readings', { body: JSON.stringify(readings), contentType: 'application/json' });
  for (const { id, rest, pressed } of readings) {
    for (let point = 0; point < rest.length; point++) {
      expect(rest[point], `${id} resting cap probe ${point}`).toBeGreaterThan(60);
      expect(pressed[point], `${id} pressed cap probe ${point}`).toBeGreaterThan(rest[point] * .6);
    }
  }
  const response = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { mesh } = view.model.controls.get('a');
    const advance = (pressed, milliseconds) => {
      view.setControl('a', pressed);
      view.changed = true;
      view.nextPaint = 0;
      view.renderedLastFrame = false;
      view.render(view.lastRender + milliseconds);
      return mesh.userData.motion.restPosition.z - mesh.position.z;
    };
    advance(false, 250);
    const compressing = advance(true, 32);
    const pressed = advance(true, 250);
    const releasing = advance(false, 32);
    const released = advance(false, 250);
    return { compressing, pressed, releasing, released };
  });
  await testInfo.attach('physical-press-response', { body: JSON.stringify(response), contentType: 'application/json' });
  expect(response.compressing, 'Compression is visible before the cap settles').toBeGreaterThan(.04);
  expect(response.compressing).toBeLessThan(response.pressed * .9);
  expect(response.releasing, 'Release stays inside the physical rest/pressed bounds').toBeGreaterThan(0);
  expect((response.pressed - response.releasing) / response.pressed,
    'Release progresses farther than compression over the same elapsed time').toBeGreaterThan(response.compressing / response.pressed + .1);
  expect(response.released).toBeLessThan(.0001);
  await page.locator('#lamp-toggle').click();
  for (const id of ['a', 'up']) {
    expect(Math.max(...await sample(id, true)), 'An unlit cap cannot acquire artificial press illumination').toBeLessThan(5);
    await sample(id, false);
  }
});

test('experimental LCD spill barely reveals nearby controls in darkness and follows screen color and power', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
  const runtime = page.frames().find(frame => frame.url().endsWith('player.html'));
  await page.locator('#tools-open').click();
  await page.locator('#pause').click();
  await page.locator('#tools-close').click();
  await page.locator('#lamp-toggle').click();
  await expect(page.locator('#lamp-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'false');
  const fill = async color => {
    await runtime.evaluate(rgb => {
      const canvas = window.EJS_emulator.canvas;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const scissor = gl.isEnabled(gl.SCISSOR_TEST);
      const clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(...rgb, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.clearColor(...clear);
      if (scissor) gl.enable(gl.SCISSOR_TEST);
    }, color);
    await expect.poll(() => page.evaluate(async rgb => {
      const { view } = await import('./src/app.js');
      const { Color } = await import('three');
      const expected = new Color(...rgb.map(channel => Math.round(channel * 255) / 255)).convertSRGBToLinear();
      return view.screenIllumination.current.toArray().every((value, axis) =>
        Math.abs(value - expected.toArray()[axis]) < .001);
    }, color)).toBe(true);
  };
  const controls = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    view.renderer.render(view.scene, view.camera);
    const gl = view.renderer.getContext();
    return Object.fromEntries([
      ['up', [0, .48, .05]], ['a', [.11, .10, .05]], ['b', [.11, .10, .05]],
      ['start', [.05, -.04, .05]], ['select', [.05, -.04, .05]],
      ['l', [0, .15, .3]], ['r', [0, .15, .3]],
    ].map(([id, point]) => {
      const mesh = view.model.controls.get(id).mesh;
      const projected = mesh.localToWorld(new Vector3(...point)).project(view.camera);
      const x = Math.round((projected.x + 1) * view.canvas.width / 2);
      const y = Math.round((projected.y + 1) * view.canvas.height / 2);
      const pixels = new Uint8Array(5 * 5 * 4);
      gl.readPixels(x - 2, y - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const sum = [0, 0, 0];
      for (let i = 0; i < pixels.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += pixels[i + c];
      return [id, sum.map(value => value / 25)];
    }));
  });
  await fill([1, 1, 1]);
  const white = await controls();
  await testInfo.attach('dark-control-white-readings', { body: JSON.stringify(white), contentType: 'application/json' });
  for (const [id, rgb] of Object.entries(white)) {
    expect(Math.max(...rgb), `${id} is faintly visible with only LCD spill`).toBeGreaterThan(2);
    expect(Math.max(...rgb), `${id} stays dim even with a full-white LCD`).toBeLessThan(35);
  }
  await page.screenshot({ path: testInfo.outputPath('experimental-lcd-control-spill-white.png') });
  await fill([.25, .25, .25]);
  const dim = await controls();
  await testInfo.attach('dark-control-dim-readings', { body: JSON.stringify(dim), contentType: 'application/json' });
  for (const [id, rgb] of Object.entries(dim)) {
    expect(Math.max(...rgb), `${id} remains visible with darker screen content`).toBeGreaterThan(1);
    expect(Math.max(...rgb), `${id} dims with the screen`).toBeLessThan(Math.max(...white[id]));
  }
  await page.screenshot({ path: testInfo.outputPath('experimental-lcd-control-spill-dim.png') });
  for (const color of [[1, 0, 0], [0, 0, 1]]) {
    await fill(color);
    const sample = (await controls()).a;
    const dominant = color.indexOf(1);
    expect(sample[dominant]).toBeGreaterThan(2);
    expect(sample[dominant]).toBeGreaterThan(Math.max(...sample.filter((_, axis) => axis !== dominant)) + 2);
  }
  await fill([0, 0, 0]);
  for (const rgb of Object.values(await controls())) expect(Math.max(...rgb)).toBeLessThan(1);
  await fill([1, 1, 1]);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').hover();
  await page.mouse.wheel(0, 350);
  const tableWithSpill = await surfaceLight(page, [0, 0, 3]);
  await page.evaluate(async () => { (await import('./src/app.js')).view.screenIllumination.controlSpill.visible = false; });
  let tableWithoutSpill;
  try { tableWithoutSpill = await surfaceLight(page, [0, 0, 3]); }
  finally {
    await page.evaluate(async () => { (await import('./src/app.js')).view.screenIllumination.controlSpill.visible = true; });
  }
  const oldTable = await surfaceLight(page, [0, 0, 3], 120);
  await testInfo.attach('lcd-table-balance', {
    body: JSON.stringify({ tableWithSpill, tableWithoutSpill, oldTable }), contentType: 'application/json',
  });
  expect(tableWithSpill, 'The dimmer forward LCD emission still lights the table').toBeGreaterThan(2);
  expect(tableWithSpill, 'The desk pool is substantially dimmer than the previous screen light').toBeLessThan(oldTable * .55);
  expect(Math.abs(tableWithSpill - tableWithoutSpill), 'Local control fill does not brighten the existing table pool').toBeLessThan(1);
  await page.screenshot({ path: testInfo.outputPath('experimental-lcd-control-spill-inspect.png') });
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#hardware-power').click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  for (const rgb of Object.values(await controls())) expect(Math.max(...rgb)).toBeLessThan(1);
});

test('mapped inputs move real button meshes and the native LCD lights the room until power off', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const runtime = page.frames().find((frame) => frame.url().endsWith('player.html'));
  const identity = await runtime.evaluate(() => window.lightingIdentity = crypto.randomUUID());
  await page.locator('#room-toggle').click();
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'true');
  expect(await runtime.evaluate(() => window.lightingIdentity)).toBe(identity);
  expect(await runtime.evaluate(() => window.EJS_emulator.paused)).toBe(false);
  await page.locator('#room-toggle').click();
  const displacement = (id) => page.evaluate(async (action) => {
    const { view } = await import('./src/app.js');
    const { mesh } = view.model.controls.get(action);
    const rest = mesh.userData.motion.restPosition;
    return { z: rest.z - mesh.position.z, y: rest.y - mesh.position.y, pitch: mesh.rotation.x, yaw: mesh.rotation.y };
  }, id);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('z');
  await expect.poll(async () => (await displacement('a')).z).toBeGreaterThan(.065);
  expect((await displacement('b')).z).toBeLessThan(.001);
  const a = await page.locator('[data-control="a"]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(100);
  expect((await displacement('a')).z, 'Pointer release cannot cancel a held mapped key').toBeGreaterThan(.065);
  await page.keyboard.up('z');
  await expect.poll(async () => (await displacement('a')).z).toBeLessThan(.001);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await displacement('up')).pitch).toBeLessThan(-.09);
  await expect.poll(async () => (await displacement('up')).yaw).toBeGreaterThan(.09);
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => Math.abs((await displacement('up')).pitch)).toBeLessThan(.001);
  for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown']) await page.keyboard.up(key);
  for (const [id, key, axis, travel] of [['b', 'x', 'z', .065], ['start', 'Enter', 'z', .036],
    ['select', 'ShiftLeft', 'z', .036], ['l', 'a', 'y', .11], ['r', 's', 'y', .11]]) {
    await page.keyboard.down(key);
    await expect.poll(async () => (await displacement(id))[axis]).toBeGreaterThan(travel);
    await page.keyboard.up(key);
    await expect.poll(async () => (await displacement(id))[axis]).toBeLessThan(.001);
  }
  await page.keyboard.down('z');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(async () => (await displacement('a')).z).toBeLessThan(.001);
  await page.keyboard.up('z');
  await page.locator('#tools-open').click();
  await page.locator('[data-binding="a"]').click();
  await page.keyboard.press('q');
  await expect(page.locator('[data-binding="a"]')).toHaveText('Q');
  await page.locator('#tools-close').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('z');
  await page.waitForTimeout(100);
  expect((await displacement('a')).z).toBeLessThan(.001);
  await page.keyboard.up('z');
  await page.keyboard.down('q');
  await expect.poll(async () => (await displacement('a')).z).toBeGreaterThan(.065);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await displacement('a')).z).toBeLessThan(.001);
  await page.keyboard.up('q');
  await page.locator('#tools-close').click();

  await page.locator('#lamp-toggle').click();
  expect(await runtime.evaluate(() => window.lightingIdentity)).toBe(identity);
  expect(await runtime.evaluate(() => window.EJS_emulator.paused)).toBe(false);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').hover();
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(300);
  const nativeLight = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const emitter = view.screenIllumination.light;
    return { power: emitter.intensity, normal: new Vector3(0, 0, -1).transformDirection(emitter.matrixWorld).toArray(),
      front: new Vector3(0, 0, 1).transformDirection(view.model.root.matrixWorld).toArray() };
  });
  expect(nativeLight.power).toBeGreaterThan(0);
  for (let axis = 0; axis < 3; axis++) expect(nativeLight.normal[axis]).toBeCloseTo(nativeLight.front[axis], 5);
  const spill = await surfaceLight(page, [0, 0, 3]);
  expect(spill, 'The mostly-black Pixel Lab picture does not brightly light the desk').toBeLessThan(5);
  await page.screenshot({ path: 'docs/images/lcd-light.png' });
  await page.locator('#tools-open').click();
  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toHaveText('Resume game');
  await page.locator('#tools-close').click();
  const emission = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.screenIllumination.current.toArray();
  });
  for (const [r, g, b] of [[1, 0, 0], [0, 0, 1], [.5, .5, .5]]) {
    // Controlled colors in the paused native framebuffer isolate actual color transfer.
    await runtime.evaluate(([red, green, blue]) => {
      const canvas = window.EJS_emulator.canvas;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const scissor = gl.isEnabled(gl.SCISSOR_TEST);
      const clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(red, green, blue, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.clearColor(...clear);
      if (scissor) gl.enable(gl.SCISSOR_TEST);
    }, [r, g, b]);
    const linear = (value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    await expect.poll(async () => (await emission()).map((value, axis) =>
      Math.abs(value - linear([r, g, b][axis]))).every((difference) => difference < .01)).toBe(true);
  }
  const brightSpill = await surfaceLight(page, [0, 0, 3]);
  expect(brightSpill,
    'Brighter content in the retained native framebuffer still lights the actual table').toBeGreaterThan(2);
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.model.root.rotateY(Math.PI);
  });
  await expect.poll(() => surfaceLight(page, [0, 0, 3])).toBeLessThan(brightSpill * .2);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#hardware-power').click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  const off = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { emission: view.screenIllumination.light.intensity, powerX: view.model.controls.get('power').mesh.position.x };
  });
  expect(off.emission).toBe(0);
  expect(off.powerX).toBe(-.1);
  expect(await surfaceLight(page, [0, 3.5, 0]), 'Unlit body, printed logo and switched-off LCD do not glow').toBeLessThan(1);
  await page.screenshot({ path: 'docs/images/dark-power-off.png' });
  expect(errors).toEqual([]);
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

test('CRT Geom is active natively and its retained live framebuffer textures the 3D LCD', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
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
  const borderSurface = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const root = view.model.root;
    root.updateWorldMatrix(true, true);
    const { width, height } = view.model.screen.geometry.userData.viewport;
    const origin = root.localToWorld(new Vector3(-width / 2, view.model.screen.position.y + height / 2 + .03, 4));
    const direction = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
    return new Raycaster(origin, direction).intersectObject(root, true)[0]?.object.name;
  });
  expect(await borderSurface(), 'The raised frame must turn with the CRT corner, not retain a square lip').toBe('Charcoal bezel');
  const outline = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const screen = view.model.screen;
    screen.updateWorldMatrix(true, false);
    const canvas = document.createElement('canvas');
    canvas.width = view.source.width; canvas.height = view.source.height;
    const context = canvas.getContext('2d');
    context.drawImage(view.source, 0, 0);
    const { width, height } = canvas, pixels = context.getImageData(0, 0, width, height).data;
    const viewport = screen.geometry.userData.viewport;
    const edge = screen.geometry.parameters.shapes.getPoints(32).map(point => ({
      x: (point.x / viewport.width + .5) * width, y: (.5 - point.y / viewport.height) * height,
    }));
    const direction = new Vector3(0, 0, -1).transformDirection(screen.matrixWorld);
    const hit = (x, y) => new Raycaster(screen.localToWorld(new Vector3(
      (x / width - .5) * viewport.width, (.5 - y / height) * viewport.height, 1)), direction).intersectObject(screen)[0];
    let clipped = 0, maxGap = 0, uvError = 0, samples = 0;
    for (let y = 2; y < height - 2; y += 3) {
      const lit = (x) => Math.max(...pixels.slice((y * width + x) * 4, (y * width + x) * 4 + 3)) > 8;
      const first = Array.from({ length: width }, (_, x) => x).find(lit);
      if (first === undefined) continue;
      const last = width - 1 - Array.from({ length: width }, (_, x) => x).find(x => lit(width - 1 - x));
      for (const x of [first, last]) {
        samples++;
        const intersection = hit(x + .5, y + .5);
        if (!intersection) { clipped++; continue; }
        uvError = Math.max(uvError, Math.abs(intersection.uv.x - (x + .5) / width),
          Math.abs(intersection.uv.y - (1 - (y + .5) / height)));
        const distance = Math.min(...edge.slice(1).map((b, index) => {
          const a = edge[index], dx = b.x - a.x, dy = b.y - a.y;
          const t = Math.max(0, Math.min(1, ((x + .5 - a.x) * dx + (y + .5 - a.y) * dy) / (dx * dx + dy * dy)));
          return Math.hypot(x + .5 - a.x - t * dx, y + .5 - a.y - t * dy);
        }));
        maxGap = Math.max(maxGap, distance);
      }
    }
    return { clipped, maxGap, uvError, samples };
  });
  expect(outline.samples).toBeGreaterThan(200);
  expect(outline.clipped, 'The fitted outline must retain the native CRT image on every sampled edge').toBe(0);
  expect(outline.maxGap, 'Only a thin black keyline should separate the image from its curved border').toBeLessThan(9);
  expect(outline.uvError, 'The border must not apply a second warp to the native CRT image').toBeLessThan(.00001);
  await page.screenshot({ path: testInfo.outputPath('curved-lcd.png') });
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
  await expect.poll(async () => (await pixelHash()).hash).not.toBe(filtered.hash);
  await expect.poll(async () => (await pixelHash()).version).toBeGreaterThan(filtered.version);
  await page.keyboard.up('z');
  await page.locator('#tools-open').click();
  await expect(page.locator('#shader')).toHaveValue('crt-geom.glslp');
  await page.locator('#shader').selectOption('disabled');
  await expect(page.locator('#shader')).toBeEnabled();
  await expect.poll(async () => (await pixelHash()).hash).not.toBe(filtered.hash);
  const child = page.frames().find((frame) => frame.url().endsWith('player.html'));
  expect(await child.evaluate(() => window.EJS_emulator.getSettingValue('shader'))).toBe('disabled');
  expect(await borderSurface(), 'Unfiltered mode restores the original rectangular screen surround').toBe('LCD recess');
  const flat = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const screen = view.model.screen;
    screen.updateWorldMatrix(true, false);
    const { width, height } = screen.geometry.userData.viewport;
    const point = screen.localToWorld(new Vector3(-width / 2 + .005, height / 2 - .005, 1));
    const direction = new Vector3(0, 0, -1).transformDirection(screen.matrixWorld);
    return new Raycaster(point, direction).intersectObject(screen)[0]?.uv.toArray();
  });
  expect(flat?.[0], 'Unfiltered content at the rectangular corner is not cropped').toBeLessThan(.002);
  expect(flat?.[1]).toBeGreaterThan(.997);
  await page.locator('#shader').selectOption('crt-geom.glslp');
  await expect(page.locator('#shader')).toBeEnabled();
  expect(await borderSurface()).toBe('Charcoal bezel');
  await page.locator('#shader').selectOption('disabled');
  await expect(page.locator('#shader')).toBeEnabled();
  await page.reload();
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
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
    await powerOn(page);
    await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
    await demoReady(page);
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
