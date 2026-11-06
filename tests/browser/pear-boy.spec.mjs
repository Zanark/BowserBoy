import { test, expect } from '@playwright/test';

async function state(page) {
  return page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Box3, Vector3 } = await import('three');
    const bounds = new Box3().setFromObject(view.pear.root);
    const corners = [];
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).project(view.camera));
    }
    const body = view.project(view.pear.face.anchor);
    return {
      position: view.pear.root.position.toArray(), on: view.pearOn,
      moving: !!view.pearMove, pointerId: view.pearMove?.pointerId,
      body, fits: corners.every(point => Math.abs(point.x) < 1 && Math.abs(point.y) < 1),
      mode: view.mode, system: view.console,
    };
  });
}

async function pixel(page, point) {
  // Power/UI state changes before a recovery-gated WebGL frame reaches the canvas.
  await expect.poll(() => page.evaluate(async () =>
    (await import('./src/app.js')).view.changed)).toBe(false);
  const position = await page.evaluate(async point => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const p = new Vector3(...point).project(view.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  }, point);
  const png = await page.screenshot();
  return page.evaluate(async ({ data, position }) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(Math.round(position.x), Math.round(position.y), 3, 3).data;
    bitmap.close();
    return [0, 1, 2].map(channel => {
      let total = 0;
      for (let i = channel; i < pixels.length; i += 4) total += pixels[i];
      return total / 9;
    });
  }, { data: png.toString('base64'), position });
}

test('pear-boy casts adjustable warm light, moves live, cancels and avoids the consoles', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#pear-open')).toBeEnabled();
  await expect.poll(async () => (await state(page)).fits).toBe(true);
  const home = (await state(page)).position;
  await page.locator('#pear-open').click();
  await expect(page.getByRole('heading', { name: 'pear-boy', exact: true })).toBeVisible();
  const lit = await pixel(page, [11.5, .02, 8.5]);
  const farLit = await pixel(page, [10, .02, 4]);
  await page.locator('#pear-toggle').click();
  await expect.poll(async () => (await state(page)).on).toBe(false);
  const dark = await pixel(page, [11.5, .02, 8.5]);
  const farDark = await pixel(page, [10, .02, 4]);
  await testInfo.attach('pear-light-readings', {
    body: JSON.stringify({ lit, dark, farLit, farDark }), contentType: 'application/json',
  });
  expect(lit[0]).toBeGreaterThan(dark[0] + 8);
  expect(lit[0] - dark[0]).toBeGreaterThan(lit[2] - dark[2]);
  expect(farLit[0], 'Diffused light must reach the clear desk beyond the immediate foot of the lamp').toBeGreaterThan(farDark[0] + 5);
  await page.locator('#pear-toggle').click();
  await page.locator('#pear-brightness').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('#pear-level')).toHaveText('10%');
  const dim = await pixel(page, [11.5, .02, 8.5]);
  expect(dim[0]).toBeLessThan(lit[0]);
  await page.keyboard.press('End');
  await expect(page.locator('#pear-level')).toHaveText('100%');
  await page.keyboard.press('Escape');
  await expect(page.locator('#pear-controls')).not.toBeVisible();
  await expect(page.locator('#tools')).not.toBeVisible();
  const before = await pixel(page, [15.3, 1.8, 10]);
  const { body } = await state(page);
  await page.mouse.move(body.x, body.y);
  await page.mouse.down();
  await page.mouse.move(body.x + 35, body.y - 170, { steps: 8 });
  await expect.poll(async () => (await state(page)).position[1]).toBeGreaterThan(3);
  expect((await state(page)).moving).toBe(true);
  const during = await pixel(page, [15.3, 1.8, 10]);
  expect(before[0]).toBeGreaterThan(during[0] + 30);
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).position[1]).toBe(0);
  expect((await state(page)).mode).toBe('table');
  await page.locator('#pear-open').click();
  await page.locator('#pear-home').click();
  expect((await state(page)).position).toEqual(home);
  await page.locator('#pear-move').click();
  await page.keyboard.press('ArrowDown');
  expect((await state(page)).position[2]).toBeGreaterThan(home[2]);
  await page.keyboard.press('Escape');
  expect((await state(page)).position).toEqual(home);
  await expect(page.locator('#tools')).not.toBeVisible();
  const rejected = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return view.movePearTo(view.model.root.position.clone());
  });
  expect(rejected).toBe(false);
  expect((await state(page)).position).toEqual(home);
  const point = (await state(page)).body;
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x - 20, point.y + 80, { steps: 5 });
  const { pointerId } = await state(page);
  await page.locator('#scene-canvas').dispatchEvent('pointercancel', { pointerId });
  await page.mouse.up();
  expect((await state(page)).position).toEqual(home);
  await page.mouse.click(point.x, point.y);
  expect((await state(page)).on).toBe(false);
  expect((await state(page)).mode).toBe('table');
  await page.mouse.click(point.x, point.y);
  expect((await state(page)).on).toBe(true);
  await page.locator('#pear-open').click();
  await page.locator('#pear-brightness').focus();
  await page.keyboard.press('End');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: testInfo.outputPath('pear-boy-table.png') });
  expect(errors).toEqual([]);
});

test('pear-boy sits at the desk edge with dangling feet and can be placed back on top', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#pear-open')).toBeEnabled();
  await expect.poll(async () => (await state(page)).fits).toBe(true);
  const feet = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3, Box3 } = await import('three');
    view.pear.root.updateWorldMatrix(true, true);
    const table = new Box3().setFromObject(view.scene.getObjectByName('Wooden tabletop'));
    return view.pear.limbs.filter(({ tip }) => tip.name === 'pear-boy rounded foot').map(({ tip, physics }) => ({
      y: tip.getWorldPosition(new Vector3()).y - table.max.y,
      front: tip.getWorldPosition(new Vector3()).z - physics.tipRadius - table.max.z,
      sleeping: physics.sleeping,
      attached: physics.positions[0].distanceTo(physics.rest[0].clone().add(view.pear.root.position)),
    }));
  });
  const home = (await state(page)).position;
  expect(home[1]).toBe(0);
  for (const foot of await feet()) {
    expect(foot.y).toBeLessThan(-.5);
    expect(foot.front).toBeGreaterThanOrEqual(-1e-5);
    expect(foot.attached).toBeLessThan(1e-6);
  }
  await page.screenshot({ path: testInfo.outputPath('pear-boy-edge.png') });
  await page.locator('#pear-open').click();
  await page.locator('#pear-move').click();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await feet()).every(foot => foot.sleeping && foot.y >= .35)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('pear-boy-on-table.png') });
  await page.locator('#pear-open').click();
  await page.locator('#pear-move').click();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown');
  expect((await state(page)).position[2]).toBe(7.5);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await feet()).every(foot => foot.sleeping && foot.y < -.5)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#pear-open').click();
  await page.locator('#pear-home').click();
  expect((await state(page)).position).toEqual(home);
  for (const foot of await feet()) expect(foot.y).toBeLessThan(-.5);
});

test.describe('pear-boy touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('phone fits pear-boy and supports real touch relocation and keyboard placement', async ({ page }, testInfo) => {
    await page.goto('./');
    await expect(page.locator('#pear-open')).toBeEnabled();
    await expect.poll(async () => (await state(page)).fits).toBe(true);
    const home = (await state(page)).position;
    const { body } = await state(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: body.x, y: body.y, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: body.x, y: body.y + 50, id: 1 }] });
    await expect.poll(async () => (await state(page)).position[2]).toBeGreaterThan(home[2]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect((await state(page)).moving).toBe(false);
    expect((await state(page)).position[1]).toBe(0);
    await page.locator('#pear-open').tap();
    await page.locator('#pear-home').tap();
    await page.locator('#pear-move').tap();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect((await state(page)).position[2]).toBeGreaterThan(home[2]);
    expect((await state(page)).moving).toBe(false);
    await page.locator('#pear-open').tap();
    await page.locator('#pear-home').tap();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: testInfo.outputPath('pear-boy-phone.png') });
  });
});

test('rope limbs remain attached, swing after pickup and respect reduced motion', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#pear-open')).toBeEnabled();
  await expect.poll(async () => (await state(page)).fits).toBe(true);
  const { body } = await state(page);
  await page.mouse.move(body.x, body.y);
  await page.mouse.down();
  await page.mouse.move(body.x, body.y - 110, { steps: 5 });
  const ropes = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    view.pear.root.updateWorldMatrix(true, true);
    return view.pear.limbs.map(({ physics, tip, curve, rope }) => ({
      tip: tip.getWorldPosition(new Vector3()).toArray(),
      end: physics.positions.at(-1).toArray(),
      anchor: physics.positions[0].distanceTo(physics.rest[0].clone().add(view.pear.root.position)),
      meshAnchor: curve.points[0].distanceTo(physics.rest[0]),
      sleeping: physics.sleeping,
      finite: [...rope.geometry.attributes.position.array].every(Number.isFinite),
      lengths: physics.positions.slice(1).map((point, i) => point.distanceTo(physics.positions[i]) - physics.lengths[i]),
      floor: physics.positions.at(-1).y - physics.tipFloor,
    }));
  });

  const before = await ropes();
  expect(before).toHaveLength(4);
  await expect.poll(async () => {
    const current = await ropes();
    return current.some((rope, i) => rope.tip.some((value, j) => Math.abs(value - before[i].tip[j]) > .02));
  }).toBe(true);
  for (const rope of await ropes()) {
    expect(rope.tip.every((value, i) => Math.abs(value - rope.end[i]) < .001)).toBe(true);
    expect(rope.anchor).toBeLessThan(1e-6);
    expect(rope.meshAnchor).toBeLessThan(1e-6);
    expect(rope.finite).toBe(true);
    expect(rope.floor).toBeGreaterThanOrEqual(-1e-6);
    expect(rope.lengths.every(error => Math.abs(error) < .04), `Rope segment errors: ${rope.lengths}`).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('pear-boy-rope-pickup.png') });
  await page.mouse.up();
  await expect.poll(async () => (await ropes()).every(rope => rope.sleeping), { timeout: 15000 }).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const point = (await state(page)).body;
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y - 35, { steps: 5 });
  expect((await state(page)).position[1]).toBeGreaterThan(0);
  await expect.poll(async () => (await ropes()).every(rope => rope.sleeping)).toBe(true);
  await page.mouse.up();
});

test('pear-boy follows the cursor, fears pickup and relaxes on release or cancellation', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#pear-open')).toBeEnabled();
  await expect.poll(async () => (await state(page)).fits).toBe(true);
  const face = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const { face } = view.pear;
    view.pear.root.updateWorldMatrix(true, true);
    const center = mesh => {
      mesh.geometry.computeBoundingSphere();
      return mesh.localToWorld(mesh.geometry.boundingSphere.center.clone()).toArray();
    };
    return {
      point: view.project(face.anchor), gaze: face.gaze.toArray(),
      eyes: face.eyes.map(({ mesh }) => mesh.getWorldPosition(new Vector3()).toArray()),
      smile: center(view.pear.root.getObjectByName('pear-boy smile')),
      freckles: face.root.children.filter(mesh => mesh.name === 'pear-boy cheek freckle').map(center),
      calm: face.calm.visible, scared: face.scared.visible,
      mouth: face.mouth.position.toArray(),
    };
  });
  await page.mouse.move(20, 850);
  await expect.poll(async () => (await face()).gaze[0]).toBeLessThan(-.9);
  const left = await face();
  const clip = { x: Math.floor(left.point.x - 45), y: Math.floor(left.point.y - 20), width: 90, height: 75 };
  const leftPixels = await page.screenshot({ clip });
  await page.mouse.move(1425, 80);
  await expect.poll(async () => (await face()).gaze[0]).toBeGreaterThan(.2);
  await expect.poll(async () => (await face()).gaze[1]).toBeGreaterThan(.9);
  const right = await face();
  for (let i = 0; i < 2; i++) {
    expect(right.eyes[i][0]).toBeGreaterThan(left.eyes[i][0] + .1);
    expect(right.eyes[i][1]).toBeGreaterThan(left.eyes[i][1] + .1);
  }
  for (const [before, after] of [[left.smile, right.smile],
    ...left.freckles.map((point, index) => [point, right.freckles[index]])]) {
    expect(after[0]).toBeGreaterThan(before[0] + .1);
    expect(after[1]).toBeGreaterThan(before[1] + .1);
  }
  expect(right.point).toEqual(left.point);
  expect((await page.screenshot({ clip })).equals(leftPixels)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('pear-boy-curious.png') });
  await page.mouse.move(right.point.x, right.point.y);
  await page.mouse.down();
  await page.mouse.move(right.point.x, right.point.y - 55, { steps: 5 });
  await expect.poll(async () => (await face()).scared).toBe(true);
  expect((await face()).calm).toBe(false);
  const held = await face();
  await expect.poll(async () => (await face()).mouth).not.toEqual(held.mouth);
  await page.screenshot({ path: testInfo.outputPath('pear-boy-scared.png') });
  await page.mouse.up();
  await expect.poll(async () => (await face()).calm).toBe(true);
  expect((await face()).scared).toBe(false);
  await page.locator('#pear-open').click();
  await page.locator('#pear-move').click();
  await expect.poll(async () => (await face()).scared).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await face()).calm).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#pear-open').click();
  await page.locator('#pear-move').click();
  expect((await face()).scared).toBe(true);
  expect((await state(page)).position[1]).toBe(0);
  const still = (await face()).mouth;
  await page.waitForTimeout(100);
  expect((await face()).mouth).toEqual(still);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await face()).calm).toBe(true);
  expect(errors).toEqual([]);
});

test('pear-boy moves in all three axes and falls through visible frames before a soft landing', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#pear-open')).toBeEnabled();
  await expect.poll(async () => (await state(page)).fits).toBe(true);
  const { body, position: home } = await state(page);
  await page.mouse.move(body.x, body.y);
  await page.mouse.down();
  await page.mouse.move(body.x + 25, body.y - 230, { steps: 10 });
  const raised = (await state(page)).position;
  expect(raised[0]).toBeGreaterThan(home[0]);
  expect(raised[1]).toBeGreaterThan(4);
  expect(raised[2]).toBeLessThan(home[2]);
  await page.mouse.wheel(0, -180);
  const closer = (await state(page)).position;
  expect(closer[1]).toBeGreaterThan(raised[1]);
  expect(closer[2]).toBeGreaterThan(raised[2]);
  await page.screenshot({ path: testInfo.outputPath('pear-boy-airborne.png') });
  const samples = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    window.pearFalls = [];
    window.recordPearFall = () => {
      window.pearFalls.push({
        y: view.pear.root.position.y, vy: view.pearMotion.velocity.y,
        scared: view.pear.face.scared.visible, sleeping: view.pearMotion.sleeping,
      });
      if (!view.pearMotion.sleeping) requestAnimationFrame(window.recordPearFall);
    };
    return view.pear.root.position.y;
  });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.evaluate(() => requestAnimationFrame(window.recordPearFall));
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.pearMotion.sleeping)).toBe(true);
  const fall = await page.evaluate(() => window.pearFalls);
  expect(fall.some(frame => frame.y > 0 && frame.y < samples - .1 && frame.vy < 0 && frame.scared)).toBe(true);
  expect(fall.some(frame => frame.vy > 0)).toBe(true);
  expect(fall.every(frame => frame.y >= 0)).toBe(true);
  expect((await state(page)).position[1]).toBe(0);
  await page.locator('#pear-open').click();
  await page.locator('#pear-home').click();
  await page.locator('#pear-move').click();
  await page.keyboard.press('PageUp');
  await page.keyboard.press('PageUp');
  expect((await state(page)).position[1]).toBeGreaterThan(1);
  await page.keyboard.press('Escape');
  expect((await state(page)).position).toEqual(home);
});
