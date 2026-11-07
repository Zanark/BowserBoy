import { test, expect } from '@playwright/test';

async function state(page, system) {
  return page.evaluate(async system => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const model = system === 'ds' ? view.ds : view.model;
    const screen = system === 'ds' ? model.screens[1] : model.screen;
    const point = screen.getWorldPosition(new Vector3()).project(view.camera);
    const bounds = view.canvas.getBoundingClientRect();
    return {
      position: model.root.position.toArray(), rotation: model.root.quaternion.toArray(),
      sleeping: view.consoleMotions[system].sleeping, moving: view.consoleMove?.system ?? null,
      selected: view.console, mode: view.mode,
      point: { x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2 },
    };
  }, system);
}

async function ready(page) {
  await page.goto('./');
  await expect(page.locator('#consoles-open')).toBeEnabled();
  await expect.poll(() => page.evaluate(async () =>
    Number.isFinite((await import('./src/app.js')).view.lastPaint))).toBe(true);
}

async function keyboardMove(page, system) {
  await page.locator('#consoles-open').click();
  await page.locator(`#move-${system}`).click();
}

test('sparse console paints retain the lift and only publish completion with aligned controls', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { view } = await import('./src/app.js'), { Box3 } = await import('three');
    view.renderer.setAnimationLoop(null);
    const originalRender = view.renderer.render.bind(view.renderer);
    const samples = [];
    view.renderer.render = (scene, camera) => {
      if (camera === view.camera) samples.push({
        y: view.ds.root.position.y,
        clear: !new Box3().setFromObject(view.ds.root).intersectsBox(new Box3().setFromObject(view.model.root)),
      });
      return originalRender(scene, camera);
    };
    const paint = time => {
      view.renderedLastFrame = false;
      view.nextPaint = 0;
      view.render(time);
    };
    try {
      const time = performance.now();
      view.selectConsole('ds');
      paint(time);
      view.nativeBusy = true;
      view.render(time + 5000);
      const deferred = { mode: view.host.dataset.view, elapsed: view.transition?.elapsed };
      view.nativeBusy = false;
      paint(time + 10000);
      const midpoint = view.host.dataset.view;
      paint(time + 15000);
      const button = document.querySelector('#ds-hardware-power').getBoundingClientRect();
      const canvas = view.canvas.getBoundingClientRect();
      const point = view.project(view.ds.controls.get('power').anchor);
      return { samples, deferred, midpoint, mode: view.host.dataset.view,
        alignment: Math.hypot(button.x + button.width / 2 - canvas.x - point.x,
          button.y + button.height / 2 - canvas.y - point.y) };
    } finally {
      view.nativeBusy = false;
      view.renderer.render = originalRender;
    }
  });
  expect(result.deferred).toEqual({ mode: 'moving', elapsed: 0 });
  expect(result.midpoint).toBe('moving');
  expect(result.mode).toBe('playing');
  expect(result.samples).toHaveLength(3);
  expect(result.samples.every(sample => sample.clear)).toBe(true);
  expect(result.samples[1].y).toBeGreaterThan(Math.max(result.samples[0].y, result.samples[2].y));
  expect(result.alignment).toBeLessThan(1);
});

test('a stalled Inspect transition completes on its next eligible real paint', async ({ page }) => {
  await ready(page);
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  const result = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
    view.renderedLastFrame = false;
    view.nextPaint = 0;
    view.setView('inspecting');
    const time = performance.now();
    const before = view.renderer.info.render.frame;
    try {
      view.nativeBusy = true;
      view.render(time + 2000);
      const deferred = { mode: view.host.dataset.view, frame: view.renderer.info.render.frame };
      view.nativeBusy = false;
      view.render(time + 4000);
      return { before, deferred, mode: view.host.dataset.view, frame: view.renderer.info.render.frame };
    } finally {
      view.nativeBusy = false;
    }
  });
  expect(result.deferred).toEqual({ mode: 'moving', frame: result.before });
  expect(result.mode).toBe('inspecting');
  expect(result.frame).toBeGreaterThan(result.before);
});

for (const system of ['gba', 'ds']) {
  test(`${system} drags in 3D without rotating, drops, and returns to its moved desk position`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    const home = await state(page, system);
    await page.mouse.move(home.point.x, home.point.y);
    await page.mouse.down();
    await page.mouse.move(home.point.x - 75, home.point.y - 150, { steps: 10 });
    await expect.poll(async () => (await state(page, system)).moving).toBe(system);
    await expect.poll(async () => (await state(page, system)).position[1]).toBeGreaterThan(home.position[1] + 2);
    const lifted = await state(page, system);
    expect(lifted.rotation).toEqual(home.rotation);
    expect(lifted.mode).toBe('table');
    await page.mouse.wheel(0, -100);
    await expect.poll(async () => (await state(page, system)).position[2]).not.toBe(lifted.position[2]);
    expect((await state(page, system)).rotation).toEqual(home.rotation);
    // Holding still removes throw velocity; the release must visibly fall.
    await page.waitForTimeout(140);
    await page.mouse.up();
    const released = await state(page, system);
    await expect.poll(async () => (await state(page, system)).position[1]).toBeLessThan(released.position[1] - .2);
    await expect.poll(async () => (await state(page, system)).sleeping).toBe(true);
    const moved = await state(page, system);
    expect(moved.rotation).toEqual(home.rotation);
    expect(moved.position[0]).not.toBe(home.position[0]);
    const other = system === 'gba' ? 'ds' : 'gba';
    const otherHome = await state(page, other);
    await page.screenshot({ path: testInfo.outputPath(`${system}-moved.png`) });
    await page.mouse.click(moved.point.x, moved.point.y);
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    expect((await state(page, system)).selected).toBe(system);
    await page.locator('#inspect').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
    await page.locator('#scene-canvas').focus();
    const inspected = await state(page, system);
    await page.keyboard.press('ArrowRight');
    expect((await state(page, system)).rotation).not.toEqual(inspected.rotation);
    await page.locator('#put-down').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
    expect((await state(page, system)).position).toEqual(moved.position);
    expect((await state(page, system)).rotation).toEqual(home.rotation);
    await page.locator(`#select-${other}`).click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
    expect((await state(page, system)).position).toEqual(moved.position);
    await page.locator('#put-down').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
    expect((await state(page, other)).position).toEqual(otherHome.position);
    await page.locator('#consoles-open').click();
    await page.locator('#consoles-home').click();
    expect((await state(page, system)).position).toEqual(home.position);
    expect(errors).toEqual([]);
  });
}

test('console keyboard placement rejects occupied spots and cancels on Escape, capture loss, blur and resize', async ({ page }) => {
  await ready(page);
  const home = await state(page, 'gba');
  await keyboardMove(page, 'gba');
  const rejected = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.moveConsoleTo(view.ds.root.position.clone());
  });
  expect(rejected).toBe(false);
  await expect(page.locator('#scene-hint')).toContainText('occupied');
  expect((await state(page, 'gba')).position).toEqual(home.position);
  for (let i = 0; i < 10; i++) await page.keyboard.press('PageUp');
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  expect((await state(page, 'gba')).position[0]).toBeGreaterThan(home.position[0] + 4);
  expect((await state(page, 'gba')).rotation).toEqual(home.rotation);
  await page.keyboard.press('Escape');
  expect((await state(page, 'gba')).position).toEqual(home.position);
  await expect(page.locator('#tools')).not.toBeVisible();
  for (const event of ['pointercancel', 'lostpointercapture']) {
    const { point } = await state(page, 'gba');
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x - 30, point.y - 120, { steps: 5 });
    const pointerId = await page.evaluate(async () => (await import('./src/app.js')).view.consoleMove.pointerId);
    await page.locator('#scene-canvas').dispatchEvent(event, { pointerId });
    await page.mouse.up();
    expect((await state(page, 'gba')).position).toEqual(home.position);
  }
  await keyboardMove(page, 'gba');
  await page.keyboard.press('PageUp');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await state(page, 'gba')).position).toEqual(home.position);
  await keyboardMove(page, 'ds');
  const dsHome = (await state(page, 'ds')).position;
  await page.keyboard.press('PageUp');
  await page.setViewportSize({ width: 1300, height: 900 });
  await expect.poll(async () => (await state(page, 'ds')).moving).toBe(null);
  expect((await state(page, 'ds')).position).toEqual(dsHome);
  // Wheel-only relocation is movement, not a click-to-play gesture.
  const { point } = await state(page, 'gba');
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.wheel(0, -100);
  await expect.poll(async () => (await state(page, 'gba')).position[2]).not.toBe(home.position[2]);
  await page.mouse.up();
  expect((await state(page, 'gba')).mode).toBe('table');
  await expect.poll(async () => (await state(page, 'gba')).sleeping).toBe(true);
  expect((await state(page, 'gba')).position).not.toEqual(home.position);
});

test.describe('console touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('phone moves either console with touch and keyboard without tilting or stealing the next tap', async ({ page }, testInfo) => {
    await ready(page);
    const cdp = await page.context().newCDPSession(page);
    for (const system of ['gba', 'ds']) {
      const home = await state(page, system);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...home.point, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: home.point.x - 18, y: home.point.y - 65, id: 1 }] });
      await expect.poll(async () => (await state(page, system)).moving).toBe(system);
      expect((await state(page, system)).position[1]).toBeGreaterThan(home.position[1]);
      expect((await state(page, system)).rotation).toEqual(home.rotation);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(async () => (await state(page, system)).sleeping).toBe(true);
      await page.locator('#consoles-open').tap();
      await page.locator('#consoles-home').tap();
      expect((await state(page, system)).position).toEqual(home.position);
      await page.keyboard.press('Escape');
      await keyboardMove(page, system);
      await page.keyboard.press('PageUp');
      await page.keyboard.press('Enter');
      await expect.poll(async () => (await state(page, system)).sleeping).toBe(true);
      expect((await state(page, system)).rotation).toEqual(home.rotation);
    }
    await page.screenshot({ path: testInfo.outputPath('consoles-phone.png') });
  });
});
