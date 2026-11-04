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

const surfaceLight = (page, position) => page.evaluate(async (point) => {
  const { view } = await import('./src/app.js');
  const { Vector3 } = await import('three');
  view.renderer.render(view.scene, view.camera);
  const projected = new Vector3(...point).project(view.camera);
  const { width, height } = view.canvas;
  const x = Math.round((projected.x + 1) * width / 2);
  const y = Math.round((projected.y + 1) * height / 2);
  if (x < 2 || y < 2 || x > width - 3 || y > height - 3) throw new Error('Lighting probe is outside the actual render.');
  const gl = view.renderer.getContext();
  const pixels = new Uint8Array(5 * 5 * 4);
  gl.readPixels(x - 2, y - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) total += pixels[i] + pixels[i + 1] + pixels[i + 2];
  return total / (25 * 3);
}, position);

test('dark room has a working physical lamp, actual light falloff and a narrow accessible toolbar', async ({ page }) => {
  await page.goto('./');
  await expect.poll(async () => (await sceneState(page))?.triangles).toBeGreaterThan(1000);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.screenIllumination.settled)).toBe(true);
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
  const budget = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
    view.renderer.setPixelRatio(1);
    view.slowFrames = 0;
    view.renderedLastFrame = false;
    view.nextPaint = 0;
    const tick = (milliseconds) => {
      view.changed = true;
      view.render(view.lastRender + milliseconds);
    };
    tick(16);
    const beforeRecovery = view.renderer.info.render.frame;
    tick(100);
    const duringRecovery = view.renderer.info.render.frame;
    tick(201); tick(16);
    const singleStallRatio = view.renderer.getPixelRatio();
    for (let i = 0; i < 6; i++) { tick(100); tick(201); }
    view.setControl('a', true);
    tick(100);
    return { singleStallRatio, beforeRecovery, duringRecovery, slowRatio: view.renderer.getPixelRatio(),
      width: view.canvas.width, cssWidth: view.width, press: view.model.controls.get('a').mesh.userData.motion.press };
  });
  expect(budget.singleStallRatio).toBe(1);
  expect(budget.duringRecovery).toBe(budget.beforeRecovery);
  expect(budget.slowRatio).toBeLessThan(1);
  expect(budget.width).toBe(Math.floor(budget.cssWidth * budget.slowRatio));
  expect(budget.press).toBeGreaterThan(.99);
});

test('mapped inputs move real button meshes and the native LCD lights the room until power off', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const runtime = page.frames().find((frame) => frame.url().endsWith('player.html'));
  const identity = await runtime.evaluate(() => window.lightingIdentity = crypto.randomUUID());
  const displacement = (id) => page.evaluate(async (action) => {
    const { view } = await import('./src/app.js');
    const { mesh } = view.model.controls.get(action);
    const rest = mesh.userData.motion.restPosition;
    return { z: rest.z - mesh.position.z, y: rest.y - mesh.position.y, pitch: mesh.rotation.x, yaw: mesh.rotation.y };
  }, id);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('z');
  await expect.poll(async () => (await displacement('a')).z).toBeGreaterThan(.04);
  expect((await displacement('b')).z).toBeLessThan(.001);
  const a = await page.locator('[data-control="a"]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(100);
  expect((await displacement('a')).z, 'Pointer release cannot cancel a held mapped key').toBeGreaterThan(.04);
  await page.keyboard.up('z');
  await expect.poll(async () => (await displacement('a')).z).toBeLessThan(.001);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await displacement('up')).pitch).toBeLessThan(-.06);
  await expect.poll(async () => (await displacement('up')).yaw).toBeGreaterThan(.06);
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => Math.abs((await displacement('up')).pitch)).toBeLessThan(.001);
  for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown']) await page.keyboard.up(key);
  for (const [id, key, axis, travel] of [['b', 'x', 'z', .04], ['start', 'Enter', 'z', .023],
    ['select', 'ShiftLeft', 'z', .023], ['l', 'a', 'y', .07], ['r', 's', 'y', .07]]) {
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
  await expect.poll(async () => (await displacement('a')).z).toBeGreaterThan(.04);
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
  expect(spill, 'The actual table receives light from the native post-shader framebuffer').toBeGreaterThan(2);
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
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.model.root.rotateY(Math.PI);
  });
  await expect.poll(() => surfaceLight(page, [0, 0, 3])).toBeLessThan(spill * .2);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#hardware-power').click();
  await expect(page.locator('#frame-host iframe')).toHaveCount(0);
  const off = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return { emission: view.screenIllumination.light.intensity, powerX: view.model.controls.get('power').mesh.position.x };
  });
  expect(off.emission).toBe(0);
  expect(off.powerX).toBe(1.45);
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
    const origin = root.localToWorld(new Vector3(-1.84, 1.48, 4));
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
    const edge = screen.geometry.parameters.shapes.getPoints(32).map(point => ({
      x: (point.x / 3.68 + .5) * width, y: (.5 - point.y / (3.68 * 2 / 3)) * height,
    }));
    const direction = new Vector3(0, 0, -1).transformDirection(screen.matrixWorld);
    const hit = (x, y) => new Raycaster(screen.localToWorld(new Vector3(
      (x / width - .5) * 3.68, (.5 - y / height) * 3.68 * 2 / 3, 1)), direction).intersectObject(screen)[0];
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
    const point = screen.localToWorld(new Vector3(-1.835, 1.22, 1));
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
