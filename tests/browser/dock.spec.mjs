import { test, expect } from '@playwright/test';
import { createDemoRom } from '../../scripts/demo-rom.mjs';
import { powerOn, demoReady, nativeFrame } from './pixel-lab.mjs';

const runtime = page => page.frames().find(frame => frame.url().endsWith('player.html'));
const ready = page => expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true', { timeout: 90000 });

const expectSeparateDocks = async page => {
  const [tools, lighting] = await page.locator('.icon-dock').evaluateAll(docks =>
    docks.map(dock => dock.getBoundingClientRect().toJSON()));
  const { width, height } = page.viewportSize();
  for (const box of [tools, lighting]) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(width);
    expect(box.bottom).toBeLessThanOrEqual(height);
  }
  expect(tools.left < lighting.right && tools.right > lighting.left &&
    tools.top < lighting.bottom && tools.bottom > lighting.top, 'Lighting and console docks do not overlap').toBe(false);
};

const demoWithAutosaveOff = async page => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('./');
  await ready(page);
  await page.locator('#pickup').click();
  // A slow native startup can legitimately auto-save before demoReady resolves.
  await page.locator('#quick-autosave').click();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
};

test('tools dock drags, collapses, cancels and resets without firing its actions', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const dock = page.locator('#action-dock');
  const handle = page.getByRole('button', { name: 'Move tools dock', exact: true });
  const toggle = page.locator('#dock-toggle');
  const lighting = await page.locator('#lighting-dock').boundingBox();
  const original = await dock.boundingBox();
  const grip = await handle.boundingBox();
  await page.mouse.move(grip.x + 22, grip.y + 22);
  await page.mouse.down();
  await page.mouse.move(grip.x + 122, grip.y - 178, { steps: 8 });
  await page.mouse.up();
  const moved = await dock.boundingBox();
  expect(moved.x).toBeCloseTo(original.x + 100, 0);
  expect(moved.y).toBeCloseTo(original.y - 200, 0);
  expect(await page.locator('#lighting-dock').boundingBox()).toEqual(lighting);
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await expect(page.locator('#tools')).toBeHidden();
  await page.locator('#room-toggle').click();
  await expect(page.locator('#room-toggle')).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAccessibleName('Expand tools dock');
  await expect(page.locator('#dock-actions')).toBeHidden();
  await expect(page.locator('#lighting-dock')).toBeVisible();
  expect(await page.locator('#lighting-dock').boundingBox()).toEqual(lighting);
  expect((await dock.boundingBox()).width).toBeLessThan(120);
  await expect(handle).toBeVisible();
  const collapsedGrip = await handle.boundingBox();
  await page.mouse.move(collapsedGrip.x + 22, collapsedGrip.y + 22);
  await page.mouse.down();
  await page.mouse.move(1438, 1098, { steps: 6 });
  await page.mouse.up();
  await toggle.evaluate(button => button.addEventListener('click', () => {
    window.expandedDock = document.getElementById('action-dock').getBoundingClientRect().toJSON();
  }, { once: true }));
  await toggle.click();
  const expanded = await page.evaluate(() => window.expandedDock);
  expect(expanded.x + expanded.width).toBeLessThanOrEqual(1432);
  expect(expanded.y + expanded.height).toBeLessThanOrEqual(1092);
  await page.locator('#quick-controls').click();
  await expect(page.locator('#tools')).toBeVisible();
  await page.locator('#tools-close').click();
  await handle.focus();
  const beforeKey = await dock.boundingBox();
  await handle.press('Shift+ArrowUp');
  expect((await dock.boundingBox()).y).toBeCloseTo(beforeKey.y - 40, 0);
  const beforeCancel = await dock.boundingBox();
  const nextGrip = await handle.boundingBox();
  await page.mouse.move(nextGrip.x + 22, nextGrip.y + 22);
  await page.mouse.down();
  await page.mouse.move(30, 30, { steps: 6 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect((await dock.boundingBox()).x).toBeCloseTo(beforeCancel.x, 0);
  expect((await dock.boundingBox()).y).toBeCloseTo(beforeCancel.y, 0);
  await expect(page.locator('#tools')).toBeHidden();
  await handle.press('Home');
  expect((await dock.boundingBox()).x).toBeCloseTo(original.x, 0);
  expect((await dock.boundingBox()).y).toBeCloseTo(original.y, 0);
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tools')).toBeVisible();
  await page.locator('#tools-close').click();
  await expect(page.locator('#scene-canvas')).toBeFocused();
  await page.locator('.skip-link').press('Enter');
  await expect(page.locator('#dock-actions')).toBeVisible();
  await expect(page.locator('#tools-open')).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('movable-dock-desktop.png') });
});

test('tools dock supports real touch dragging and stays reachable after cancellation and resize', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL, viewport: { width: 390, height: 844 }, hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('./');
    await ready(page);
    const dock = page.locator('#action-dock');
    const handle = page.locator('#dock-drag');
    const touch = await context.newCDPSession(page);
    const grip = await handle.boundingBox();
    const original = await dock.boundingBox();
    const x = grip.x + 22, y = grip.y + 22;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 180 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect((await dock.boundingBox()).y).toBeCloseTo(original.y - 180, 0);
    await page.locator('#dock-toggle').tap();
    const collapsed = await handle.boundingBox();
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart',
      touchPoints: [{ x: collapsed.x + 22, y: collapsed.y + 22 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 388, y: 842 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(dock).not.toHaveAttribute('data-dragging', '');
    const cancelled = await dock.boundingBox();
    await page.mouse.move(50, 50);
    expect((await dock.boundingBox()).y).toBeCloseTo(cancelled.y, 0);
    for (const [width, height] of [[320, 568], [844, 390], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.locator('#dock-toggle').tap();
      await expect.poll(async () => {
        const box = await dock.boundingBox();
        return box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height;
      }).toBe(true);
      await page.locator('#dock-toggle').tap();
    }
    await page.locator('#dock-toggle').tap();
    await page.screenshot({ path: test.info().outputPath('movable-dock-phone.png') });
  } finally { await context.close(); }
});

test('settings drawer closes on a backdrop click but not inside clicks or drags from inside', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const drawer = page.locator('#tools');
  for (const [width, height] of [[1440, 1100], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.locator('#tools-open').click();
    const logo = await drawer.locator('.panel-logo').boundingBox();
    const panel = await drawer.boundingBox();
    expect(Math.abs(logo.x + logo.width / 2 - panel.x - panel.width / 2)).toBeLessThanOrEqual(1);
    const box = await drawer.boundingBox();
    const outside = { x: box.x / 2, y: height / 2 };
    const inside = { x: box.x + 5, y: 60 };
    await page.mouse.click(inside.x, inside.y);
    await expect(drawer).toBeVisible();
    await page.locator('#volume').fill('37');
    await expect(drawer).toBeVisible();
    await page.mouse.move(inside.x, inside.y);
    await page.mouse.down();
    await page.mouse.move(outside.x, outside.y);
    await page.mouse.up();
    await expect(drawer).toBeVisible();
    await page.mouse.click(outside.x, outside.y);
    await expect(drawer).toBeHidden();
    await expect(page.locator('#scene-canvas')).toBeFocused();
    await expect(page.locator('#scene')).toHaveAttribute('data-power', 'off');
    await page.locator('#tools-open').click();
    await page.locator('#tools-close').click();
    await expect(drawer).toBeHidden();
    await page.locator('#tools-open').click();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  }
});

test('inspection shows the animated purple console logo, with static reduced-motion and separate table branding', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await ready(page);
  const heading = page.locator('.desk-heading h1');
  const image = heading.locator('img');
  await expect(image).toHaveAttribute('src', './assets/website-logo.png');
  await page.locator('#pickup').click();
  await expect(heading).toBeHidden();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect(image).toHaveAttribute('src', './assets/inspection-logo.png');
  await expect(image).toHaveAttribute('alt', 'BowserBOYADVANCED');
  expect(await image.evaluate(async image => {
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  })).toEqual([1080, 420]);
  expect(await heading.evaluate(element => getComputedStyle(element, '::after').display)).toBe('none');
  const first = await image.screenshot();
  await page.waitForTimeout(280);
  await expect.poll(async () => (await image.screenshot()).equals(first),
    { message: 'inspection logo presents a different animated frame' }).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => image.evaluate(image => new URL(image.currentSrc).pathname)).toMatch(/\/assets\/logo\.png$/);
  await image.evaluate(image => image.decode());
  const still = await image.screenshot();
  await page.waitForTimeout(280);
  expect((await image.screenshot()).equals(still)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, height] of [[1440, 1100], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const box = await image.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: test.info().outputPath('animated-inspection-logo-phone.png') });
  await page.locator('#inspect').click();
  await expect(heading).toBeHidden();
  await page.locator('#put-down').click();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', './assets/website-logo.png');
});

test('BowserBOY website branding is separate from static GBA settings and DS artwork', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await expect(page).toHaveTitle('BowserBOY');
  await expect(page.locator('.desk-heading h1 img, .panel-logo')).toHaveCount(4);
  for (const [selector, file, alt, width, height] of [
    ['.desk-heading h1 img', 'website-logo.png', 'BowserBOY', 2148, 732],
    ['#tools > .panel-logo', 'logo.png', 'BowserBOY Advance', 2170, 725],
    ['#frame-host > .panel-logo', 'logo.png', 'BowserBOY Advance', 2170, 725],
    ['#ds-tools > .panel-logo', 'ds-logo.png', 'BowserBOY DS chrome neon emblem', 2149, 732],
  ]) {
    const logo = page.locator(selector);
    await expect(logo).toHaveAttribute('src', `./assets/${file}`);
    await expect(logo).toHaveAttribute('alt', alt);
    expect(await logo.evaluate(async image => {
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    })).toEqual({ width, height });
  }
  const consoleBrand = await page.evaluate(async () => {
    const { brandImage } = await import('./src/brand.js');
    const header = document.querySelector('.desk-heading h1 img');
    return { path: new URL(brandImage.src).pathname.split('/').pop(),
      width: brandImage.naturalWidth, height: brandImage.naturalHeight,
      separate: brandImage.src !== header.src, filter: getComputedStyle(header).filter };
  });
  expect(consoleBrand).toMatchObject({ path: 'logo.png', width: 2170, height: 725, separate: true });
  expect(consoleBrand.filter).not.toContain('176, 117, 240');
  for (const [width, height] of [[1440, 1100], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('.desk-heading h1')).toBeVisible();
    const box = await page.locator('.desk-heading h1 img').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.width / box.height).toBeCloseTo(2148 / 732, 2);
    await page.locator('.desk-heading h1 img').screenshot({ path: test.info().outputPath(`website-logo-${width}.png`) });
  }
  await page.locator('#tools-open').click();
  await expect(page.locator('#tools .panel-logo')).toBeVisible();
  await page.locator('#tools-close').click();
  await page.locator('#pickup').click();
  await expect(page.locator('.desk-heading h1')).toBeHidden();
  await expect(page.locator('#inspect')).toBeEnabled();
  await page.locator('#inspect').click();
  await expect(page.locator('.desk-heading h1')).toBeVisible();
});

test('ordinary play zoom fits desktop and phone without changing the native game or inspection and fullscreen zoom', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('./');
  await ready(page);
  const control = page.locator('#play-zoom-control');
  const slider = page.getByRole('slider', { name: 'Play view zoom', exact: true });
  await expect(control).toBeHidden();
  await page.locator('#pickup').click();
  await expect(control).toBeVisible();
  await expect(slider).toHaveValue('50');
  await expect(page.locator('#play-zoom-value')).toHaveText('50%');
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
  const frame = runtime(page);
  await frame.evaluate(() => { window.zoomRuntime = window.EJS_emulator; });
  const nativeBefore = await nativeFrame(page);
  const layout = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Vector3 } = await import('three');
    const zoom = document.getElementById('play-zoom-control').getBoundingClientRect();
    const intersects = box => zoom.left < box.right && zoom.right > box.left &&
      zoom.top < box.bottom && zoom.bottom > box.top;
    const positions = view.model.screen.geometry.getAttribute('position');
    const points = Array.from({ length: positions.count }, (_, i) => {
      const point = view.model.screen.localToWorld(new Vector3().fromBufferAttribute(positions, i)).project(view.camera);
      return { x: (point.x + 1) * view.width / 2, y: (1 - point.y) * view.height / 2 };
    });
    const lcd = { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
      top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) };
    const obstacles = [lcd, document.querySelector('.scene-actions').getBoundingClientRect(),
      ...[...document.querySelectorAll('#hardware-targets button:not([hidden])')].map(button => button.getBoundingClientRect())];
    return { z: view.camera.position.z, playZoom: view.playZoom, inspectionZoom: view.zoom,
      width: lcd.right - lcd.left, height: lcd.bottom - lcd.top,
      clear: obstacles.every(box => !intersects(box)),
      inside: zoom.left >= 0 && zoom.right <= innerWidth && zoom.top >= 0 && zoom.bottom <= innerHeight };
  });
  for (const [width, height] of [[1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await slider.focus();
    await page.keyboard.press('Home');
    await expect(page.locator('#play-zoom-value')).toHaveText('50%');
    await expect.poll(async () => {
      const fit = await layout();
      return fit.clear && fit.inside && fit.playZoom === .5;
    }).toBe(true);
    const fitted = await layout();
    await page.keyboard.press('End');
    await expect(page.locator('#play-zoom-value')).toHaveText('100%');
    await expect.poll(async () => (await layout()).z / fitted.z).toBeCloseTo(.5, 4);
    const larger = await layout();
    expect(larger.width).toBeGreaterThan(fitted.width * 1.9);
    expect(larger.height).toBeGreaterThan(fitted.height * 1.9);
    expect(larger.inside).toBe(true);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('51');
    await page.keyboard.press('End');
    if (width === 1440 || width === 320) {
      await page.screenshot({ path: test.info().outputPath(`ordinary-play-zoom-${width}.png`) });
    }
  }
  expect((await nativeFrame(page)).left).toBe(nativeBefore.left);
  await slider.fill('75');
  await expect(page.locator('#play-zoom-value')).toHaveText('75%');
  await page.locator('#inspect').click();
  await expect(control).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Equal');
  await expect.poll(async () => (await layout()).inspectionZoom).toBeCloseTo(.9, 4);
  await page.keyboard.press('Home');
  await page.locator('#inspect').click();
  await expect(control).toBeVisible();
  await expect(slider).toHaveValue('75');
  await expect.poll(async () => (await layout()).playZoom).toBe(.75);
  await page.locator('#put-down').click();
  await expect(control).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await page.locator('#pickup').click();
  await expect(control).toBeVisible();
  await expect(slider).toHaveValue('75');
  await page.locator('#quick-screen-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('screen-focus');
  await expect(control).toBeHidden();
  await page.locator('#screen-focus-zoom').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('#screen-focus-zoom-value')).toHaveText('50%');
  await page.locator('#screen-focus-close').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await expect(slider).toHaveValue('75');
  expect((await layout()).playZoom).toBe(.75);
  expect(runtime(page)).toBe(frame);
  expect(await frame.evaluate(() => window.zoomRuntime === window.EJS_emulator)).toBe(true);
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('ArrowRight');
  try { await expect.poll(async () => (await nativeFrame(page)).left).toBeGreaterThan(nativeBefore.left); }
  finally { await page.keyboard.up('ArrowRight'); }
});

test('website logo glow shimmers left to right, repeats and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await ready(page);
  const heading = page.locator('.desk-heading h1');
  await expect(heading.locator('img')).toHaveAttribute('src', './assets/website-logo.png');
  await expect.poll(() => heading.evaluate(element =>
    element.getAnimations({ subtree: true }).filter(animation => animation.animationName === 'website-logo-shimmer').length)).toBe(1);
  const timing = await heading.evaluate(element => {
    const animation = element.getAnimations({ subtree: true }).find(animation => animation.animationName === 'website-logo-shimmer');
    animation.pause();
    return animation.effect.getTiming();
  });
  expect(timing.duration).toBe(6000);
  expect(timing.iterations).toBe(Infinity);
  const samples = [];
  for (const [label, time] of [['rest', 0], ['left', 4500], ['right', 5100], ['repeat', 10500]]) {
    samples.push(await heading.evaluate((element, time) => {
      element.getAnimations({ subtree: true }).find(animation => animation.animationName === 'website-logo-shimmer').currentTime = time;
      const style = getComputedStyle(element, '::after');
      return { position: parseFloat(style.maskPosition), mask: style.maskImage, pointerEvents: style.pointerEvents };
    }, time));
    await heading.screenshot({ path: test.info().outputPath(`website-shimmer-${label}.png`) });
  }
  // A larger mask moves right as its percentage position decreases.
  expect(samples[1].position).toBeGreaterThan(samples[2].position);
  expect(samples[3].position).toBeCloseTo(samples[1].position, 2);
  expect(samples[1].mask).toContain('linear-gradient');
  expect(samples[1].pointerEvents).toBe('none');
  await page.locator('#pickup').click();
  await expect(heading).toBeHidden();
  expect(await heading.evaluate(element => getComputedStyle(element, '::after').animationPlayState)).toBe('paused');
  await page.locator('#inspect').click();
  await expect(heading).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await heading.evaluate(element => getComputedStyle(element, '::after').animationName)).toBe('none');
  await expect(heading.locator('img')).toBeVisible();
});

test('favicon retains the wide handheld silhouette at browser-tab sizes', async ({ page }) => {
  await page.goto('./');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  const samples = await icon.evaluate(async link => {
    const image = new Image();
    image.src = link.href;
    await image.decode();
    return [16, 32, 64].map(size => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, size, size);
      const { data } = context.getImageData(0, 0, size, size);
      let left = size, right = -1, top = size, bottom = -1;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (data[(y * size + x) * 4 + 3] < 128) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      return { size, ratio: (right - left + 1) / (bottom - top + 1),
        transparentCorner: data[3] === 0, image: canvas.toDataURL() };
    });
  });
  for (const sample of samples) {
    expect(sample.transparentCorner).toBe(true);
    expect(sample.ratio).toBeGreaterThan(1.55);
    expect(sample.ratio).toBeLessThan(2.1);
    await test.info().attach(`favicon-${sample.size}`, {
      body: Buffer.from(sample.image.split(',')[1], 'base64'), contentType: 'image/png',
    });
  }
});

test('icon dock fits phone and desktop, exposes named touch controls and opens the requested sections', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  for (const [width, height] of [[1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await expectSeparateDocks(page);
    const controls = await page.locator('.icon-dock button:visible').evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect();
      return { label: button.getAttribute('aria-label'), icons: button.querySelectorAll('svg').length,
        width: box.width, height: box.height, left: box.left, right: box.right, bottom: box.bottom };
    }));
    for (const control of controls) {
      expect(control.label).toBeTruthy();
      expect(control.icons).toBe(1);
      expect(control.width).toBeGreaterThanOrEqual(44);
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(width);
      expect(control.bottom).toBeLessThanOrEqual(height);
    }
    if (width <= 390) {
      const dock = await page.locator('.scene-actions').boundingBox();
      expect(dock.height, 'Console controls fit in at most three rows without shrinking touch targets')
        .toBeLessThan(150);
      await expect.poll(async () => {
        const power = await page.locator('#hardware-power').boundingBox();
        const currentDock = await page.locator('.scene-actions').boundingBox();
        return power.y + power.height - currentDock.y;
      }, { message: 'Default dock leaves the physical power target reachable after the resized frame' }).toBeLessThan(0);
    }
    await page.screenshot({ path: test.info().outputPath(`icon-dock-${width}.png`) });
  }
  await page.locator('#quick-controls').click();
  await expect(page.locator('#tools')).toBeVisible();
  await expect(page.locator('[data-binding="up"]')).toBeFocused();
  await expect(page.locator('[data-binding="up"]')).toBeInViewport();
  await page.locator('#tools-close').click();
  await page.locator('#quick-slots').click();
  await expect(page.locator('#checkpoint-slot')).toBeFocused();
  await expect(page.locator('#checkpoint-slot')).toBeInViewport();
  await page.locator('#tools-close').click();
  await page.locator('#quick-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('player');
  await expect(page.locator('#lighting-dock')).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  const tableDock = await page.locator('.scene-actions').boundingBox();
  expect(tableDock.height).toBeLessThan(150);
  expect(tableDock.x).toBeGreaterThanOrEqual(0);
  expect(tableDock.x + tableDock.width).toBeLessThanOrEqual(320);
  await page.locator('#consoles-open').click();
  await expect(page.locator('#console-controls')).toBeVisible();
  await expect(page.locator('#move-gba')).toBeInViewport();
  await expect(page.locator('#move-ds')).toBeInViewport();
});

test('lighting dock controls shared lights independently of GBA and DS tools, view and screen size', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const lighting = page.getByRole('navigation', { name: 'Room and desk lighting', exact: true });
  await expect(lighting.locator('button')).toHaveCount(3);
  await expect(page.locator('#action-dock').locator('#lamp-toggle, #room-toggle, #pear-open')).toHaveCount(0);
  await page.locator('#pickup').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#dock-toggle').click();
  await expect(page.locator('#dock-actions')).toBeHidden();
  await lighting.locator('#lamp-toggle').click();
  await lighting.locator('#room-toggle').click();
  await lighting.locator('#pear-open').click();
  await expect(page.locator('#pear-controls')).toBeVisible();
  await page.locator('#pear-toggle').click();
  await page.locator('#pear-brightness').press('Home');
  await expect(page.locator('#pear-level')).toHaveText('10%');
  const lights = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return [view.lampOn, view.roomLightsOn, view.pearOn, view.pearBrightness];
  });
  expect(await lights()).toEqual([false, true, false, .1]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pear-controls')).toBeHidden();
  await expect(page.locator('#dock-actions')).toBeHidden();
  await page.locator('#dock-toggle').click();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect(lighting).toBeVisible();
  await page.locator('#select-ds').click();
  await expect(page.locator('#player')).toHaveAttribute('data-console', 'ds');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  expect(await lights()).toEqual([false, true, false, .1]);
  await page.locator('#dock-toggle').click();
  await lighting.locator('#lamp-toggle').click();
  await lighting.locator('#room-toggle').click();
  expect(await lights()).toEqual([true, false, false, .1]);
  await expect(page.locator('#dock-actions')).toBeHidden();
  await page.locator('#dock-toggle').click();
  for (const [width, height] of [[1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await expectSeparateDocks(page);
    await expect.poll(() => page.evaluate(async ({ width, height }) => {
      const { view } = await import('./src/app.js');
      return view.width === width && view.height === height && !view.changed;
    }, { width, height }), { message: 'DS room has painted at the new viewport size' }).toBe(true);
    await expect(page.locator('#ds-hardware-power')).toBeInViewport();
    await expect(lighting.locator('#pear-open')).toBeInViewport();
    if (width === 1440 || width === 320) {
      await page.screenshot({ path: test.info().outputPath(`ds-lighting-dock-${width}.png`) });
    }
  }
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await expect(page.locator('#ds-inspect-controls')).toBeVisible();
  const lightBox = await lighting.boundingBox();
  const poseBox = await page.locator('#ds-inspect-controls').boundingBox();
  expect(poseBox.y).toBeGreaterThan(lightBox.y + lightBox.height);
  await expectSeparateDocks(page);
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await expect(lighting).toBeVisible();
  await expectSeparateDocks(page);
});

test('three checkpoint slots stay independent and reject invalid slots without changing legacy saves', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const result = await page.evaluate(async () => {
    const { SaveStore } = await import('./src/save-store.js');
    const { RUNTIME } = await import('./src/cartridge.js');
    const store = new SaveStore();
    await store.open();
    const game = { id: 'slot-fixture', title: 'Slot fixture', runtime: RUNTIME };
    const capture = number => ({ state: new Uint8Array([number]), sram: new Uint8Array([number + 10]) });
    await store.putSlot(game, 'manual', capture(1));
    await store.putSlot(game, 'automatic', capture(4));
    await store.putSlot(game, 'manual2', capture(2));
    await store.putSlot(game, 'manual3', capture(3));
    let error;
    try { await store.putSlot(game, 'manual4', capture(9)); }
    catch (failure) { error = failure.message; }
    const record = await store.get(game.id);
    await store.putBattery(game, new Uint8Array([99]));
    const poweredOff = await store.get(game.id);
    return { slots: ['manual', 'manual2', 'manual3', 'automatic'].map(slot => [...record[slot].state]),
      error, coldBoot: poweredOff.bootMode, retained: [...poweredOff.manual2.state], battery: [...poweredOff.battery.sram] };
  });
  expect(result).toEqual({ slots: [[1], [2], [3], [4]], error: 'Unknown save slot.', coldBoot: 'battery', retained: [2], battery: [99] });
});

test('screen fullscreen returns to an advancing main-view LCD without replacing the runtime', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#quick-autosave').click();
  await page.locator('#tools-open').click();
  await page.locator('#demo').click();
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
  const frame = runtime(page);
  await frame.evaluate(() => { window.fullscreenRuntime = window.EJS_emulator; });
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Box3, Vector3 } = await import('three');
    view.scene.onAfterRender = () => {
      if (!window.captureReturnedLcd) return;
      window.captureReturnedLcd = false;
      const box = new Box3().setFromObject(view.model.screen);
      const corners = [];
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) corners.push(new Vector3(x, y, z).project(view.camera));
      }
      const { width, height } = view.canvas;
      const left = Math.max(0, Math.floor((Math.min(...corners.map(p => p.x)) + 1) * width / 2));
      const bottom = Math.max(0, Math.floor((Math.min(...corners.map(p => p.y)) + 1) * height / 2));
      const w = Math.min(width - left, Math.ceil((Math.max(...corners.map(p => p.x)) + 1) * width / 2) - left);
      const h = Math.min(height - bottom, Math.ceil((Math.max(...corners.map(p => p.y)) + 1) * height / 2) - bottom);
      const pixels = new Uint8Array(w * h * 4);
      const gl = view.renderer.getContext();
      gl.readPixels(left, bottom, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let hash = 2166136261;
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
      window.returnedLcd = { hash, nonzero: pixels.some((value, index) => index % 4 !== 3 && value > 0) };
    };
  });
  const lcd = async () => {
    await page.evaluate(() => { window.returnedLcd = null; window.captureReturnedLcd = true; });
    await expect.poll(() => page.evaluate(() => window.returnedLcd)).not.toBeNull();
    return page.evaluate(() => window.returnedLcd);
  };
  const painted = () => page.evaluate(async () => (await import('./src/app.js')).view.lastPaint);
  for (const exit of ['Escape', 'button']) {
    const original = await lcd();
    expect(original.nonzero).toBe(true);
    const before = await painted();
    await page.locator('#quick-screen-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('screen-focus');
    if (exit === 'button') await page.evaluate(async () => {
      // Reproduce a room animation loop suspended while its canvas is covered.
      (await import('./src/app.js')).view.renderer.setAnimationLoop(null);
    });
    const fullscreenPixels = () => page.locator('#screen-focus-canvas').evaluate(canvas => canvas.toDataURL());
    const start = await fullscreenPixels();
    await page.keyboard.down('ArrowRight');
    try { await expect.poll(fullscreenPixels).not.toBe(start); }
    finally { await page.keyboard.up('ArrowRight'); }
    if (exit === 'Escape') await page.keyboard.press('Escape');
    else await page.locator('#screen-focus-close').click();
    await expect(page.locator('#screen-focus')).toBeHidden();
    await expect.poll(painted).toBeGreaterThan(before);
    const resumed = await painted();
    let returned;
    await expect.poll(async () => {
      returned = await lcd();
      return returned.hash;
    }).not.toBe(original.hash);
    await expect.poll(painted).toBeGreaterThan(resumed);
    await page.locator('#scene-canvas').focus();
    await page.keyboard.down('ArrowLeft');
    try { await expect.poll(async () => (await lcd()).hash).not.toBe(returned.hash); }
    finally { await page.keyboard.up('ArrowLeft'); }
    expect(await frame.evaluate(() => window.fullscreenRuntime === window.EJS_emulator)).toBe(true);
  }
});

test('holding Space runs the native cartridge at 2x and release or lost input restores 1x by default', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#quick-autosave').click();
  await page.locator('#rom-file').setInputFiles({
    name: 'Pixel Lab Hold Clock.gba', mimeType: 'application/octet-stream',
    buffer: Buffer.from(createDemoRom({ frameClock: true })),
  });
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  await expect(page.locator('#scene')).toHaveAttribute('data-cartridge', 'seated');
  const frame = runtime(page);
  await page.locator('#tools-open').click();
  await page.locator('#shader').selectOption('disabled');
  await page.locator('#tools-close').click();
  await frame.evaluate(() => window.EJS_emulator.changeSettingOption('vsync', 'enabled'));
  // Isolate native pacing from software rendering without opening a modal that owns the keys.
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
  });
  const saved = await page.evaluate(() => localStorage.getItem('bowser-boy-advance-preferences'));
  const measure = () => frame.evaluate(async () => {
    const read = () => {
      const sram = window.EJS_emulator.gameManager.getSaveFile();
      return sram[4] | sram[5] << 8;
    };
    await new Promise(resolve => setTimeout(resolve, 250));
    const start = read(), time = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1500));
    return ((read() - start + 65536) % 65536) * 1000 / (performance.now() - time);
  });
  const expectSpeed = async speed => {
    await expect(page.locator('#quick-speed')).toHaveAccessibleName(`Emulation speed: ${speed}x`);
    await expect.poll(() => frame.evaluate(() => window.EJS_emulator.isFastForward)).toBe(speed > 1);
  };
  await page.locator('#scene-canvas').focus();
  const baseline = await measure();
  expect(baseline).toBeGreaterThan(45);
  expect(baseline).toBeLessThan(70);
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await expectSpeed(2);
  expect(await frame.evaluate(() => window.EJS_emulator.getSettingValue('ff-ratio'))).toBe('2.0');
  const held = await measure();
  expect(held / baseline).toBeGreaterThan(1.4);
  expect(held / baseline).toBeLessThan(2.6);
  expect(await page.evaluate(() => localStorage.getItem('bowser-boy-advance-preferences'))).toBe(saved);
  await page.keyboard.up('Space');
  await expectSpeed(1);
  const released = await measure();
  expect(released / baseline).toBeGreaterThan(.7);
  expect(released / baseline).toBeLessThan(1.3);
  await test.info().attach('hold-space-cartridge-clock', {
    body: JSON.stringify({ baseline, held, released }), contentType: 'application/json',
  });
  expect(await page.evaluate(() => localStorage.getItem('bowser-boy-advance-preferences'))).toBe(saved);
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(time => view.render(time));
  });
  await page.locator('#quick-speed').click();
  await page.locator('[data-speed="3"]').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.keyboard.up('Space');
  await expectSpeed(1);
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.locator('#tools-open').click();
  await expectSpeed(1);
  await page.keyboard.up('Space');
  await page.locator('#volume').focus();
  await page.keyboard.press('Space');
  await expectSpeed(1);
  await page.locator('#volume').fill('37');
  await page.locator('#volume').dispatchEvent('change');
  await expectSpeed(1);
  await page.locator('#tools-close').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expectSpeed(1);
  await page.keyboard.down('Space');
  await expectSpeed(1);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.locator('#inspect').click();
  await expectSpeed(1);
  await page.keyboard.up('Space');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Space');
  await expectSpeed(1);
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#quick-screen-fullscreen').click();
  await expect(page.locator('#screen-focus-canvas')).toBeFocused();
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.keyboard.press('Escape');
  await expectSpeed(1);
  await page.keyboard.up('Space');
  await frame.evaluate(() => {
    const canvas = document.querySelector('canvas[data-bba-display]');
    canvas.tabIndex = 0;
    canvas.focus();
  });
  await expect(frame.locator('canvas[data-bba-display]')).toBeFocused();
  await page.keyboard.down('Space');
  await expectSpeed(2);
  await page.keyboard.up('Space');
  await expectSpeed(1);
  expect(runtime(page)).toBe(frame);
  await frame.evaluate(() => {
    window.holdInputs = [];
    const game = window.EJS_emulator.gameManager;
    const simulate = game.simulateInput.bind(game);
    game.simulateInput = (...args) => { window.holdInputs.push(args); return simulate(...args); };
  });
  await page.locator('#quick-controls').click();
  await page.locator('[data-binding="a"]').click();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-binding="a"]')).toHaveText('Space');
  await page.locator('#tools-close').click();
  await page.locator('#scene-canvas').focus();
  await page.keyboard.press('Space');
  await expectSpeed(1);
  await expect.poll(() => frame.evaluate(() => window.holdInputs)).toEqual([[0, 8, 1], [0, 8, 0]]);
});

test('fast-forward advances the cartridge clock after native VSync changes and returns to normal speed', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#quick-autosave').click();
  await page.locator('#rom-file').setInputFiles({
    name: 'Pixel Lab Clock.gba', mimeType: 'application/octet-stream',
    buffer: Buffer.from(createDemoRom({ tone: true, frameClock: true })),
  });
  await powerOn(page);
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  // Isolate native pacing from software rendering between real speed-control clicks.
  await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    view.renderer.setAnimationLoop(null);
  });
  const frame = runtime(page);
  const identity = await frame.evaluate(() => {
    window.speedVSyncCalls = [];
    const game = window.EJS_emulator.gameManager;
    const original = game.setVSync.bind(game);
    game.setVSync = value => { window.speedVSyncCalls.push(value); return original(value); };
    return window.speedIdentity = crypto.randomUUID();
  });
  const select = async speed => {
    if (await page.locator('#tools').isVisible()) await page.locator('#tools-close').click();
    await page.locator('#quick-speed').click();
    await page.locator(`[data-speed="${speed}"]`).click();
    await page.locator('#tools-open').click();
  };
  const measure = () => frame.evaluate(async () => {
    const game = window.EJS_emulator.gameManager;
    await new Promise(resolve => setTimeout(resolve, 250));
    const read = () => {
      const sram = game.getSaveFile();
      return sram[4] | sram[5] << 8;
    };
    const start = read(), time = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1500));
    const end = read(), elapsed = performance.now() - time;
    return { frames: (end - start + 65536) % 65536, elapsed,
      fps: ((end - start + 65536) % 65536) * 1000 / elapsed };
  });
  await select(1);
  // Measure core pacing independently of the CRT shader's software-GPU cost.
  await page.locator('#shader').selectOption('disabled');
  await expect.poll(() => frame.evaluate(() => window.EJS_emulator.getSettingValue('shader'))).toBe('disabled');
  const baseline = await measure();
  expect(baseline.fps).toBeGreaterThan(45);
  expect(baseline.fps).toBeLessThan(70);
  await select(4);
  // A real native setting can restore rAF pacing while isFastForward stays true.
  await frame.evaluate(() => window.EJS_emulator.changeSettingOption('vsync', 'enabled'));
  const samples = [];
  for (const speed of [4, 2, 3, 1]) {
    await select(speed);
    const sample = await measure();
    samples.push({ speed, ...sample, multiplier: sample.fps / baseline.fps });
    await test.info().attach(`cartridge-clock-${speed}x`, {
      body: JSON.stringify({ baseline, samples }), contentType: 'application/json',
    });
    expect(sample.fps / baseline.fps).toBeGreaterThan(speed * .7);
    expect(sample.fps / baseline.fps).toBeLessThan(speed * 1.3);
    expect(await frame.evaluate(() => window.EJS_emulator.getSettingValue('vsync'))).toBe('enabled');
    expect(await frame.evaluate(() => window.speedVSyncCalls.at(-1))).toBe(speed === 1);
    expect(await frame.evaluate(() => window.speedIdentity)).toBe(identity);
  }
  await frame.evaluate(() => window.EJS_emulator.changeSettingOption('vsync', 'disabled'));
  await select(2);
  await select(1);
  expect(await frame.evaluate(() => window.speedVSyncCalls.at(-1))).toBe(false);
  expect(await frame.evaluate(() => window.EJS_emulator.getSettingValue('vsync'))).toBe('disabled');
});

test('quick actions reach real core speed and retain the live LCD through screen fullscreen', async ({ page }) => {
  await demoWithAutosaveOff(page);
  const frame = runtime(page);
  const identity = await frame.evaluate(() => window.runtimeIdentity = crypto.randomUUID());
  await frame.evaluate(() => {
    window.speedCalls = [];
    const game = window.EJS_emulator.gameManager;
    for (const name of ['setFastForwardRatio', 'toggleFastForward']) {
      const original = game[name].bind(game);
      game[name] = (...args) => { window.speedCalls.push([name, ...args]); return original(...args); };
    }
  });
  for (const speed of [3, 4, 2, 1]) {
    await page.locator('#quick-speed').click();
    await page.locator(`[data-speed="${speed}"]`).click();
    await expect(page.locator('#quick-speed')).toHaveAccessibleName(`Emulation speed: ${speed}x`);
    expect(await frame.evaluate(() => window.EJS_emulator.isFastForward)).toBe(speed > 1);
    expect(await frame.evaluate(() => window.EJS_emulator.getSettingValue('ff-ratio'))).toBe(`${speed}.0`);
  }
  const calls = await frame.evaluate(() => window.speedCalls);
  for (const speed of [2, 3, 4]) expect(calls).toContainEqual(['setFastForwardRatio', speed]);
  expect(calls).toContainEqual(['toggleFastForward', 0]);
  await page.evaluate(() => {
    document.getElementById('screen-focus').requestFullscreen = () => Promise.reject(new Error('Simulated fullscreen refusal'));
  });
  try {
    await page.locator('#quick-screen-fullscreen').click();
    await expect(page.locator('#notice')).toContainText('Screen fullscreen could not open: Simulated fullscreen refusal');
    await expect(page.locator('#screen-focus')).toBeHidden();
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  } finally {
    await page.evaluate(() => delete document.getElementById('screen-focus').requestFullscreen);
  }
  await page.locator('#put-down').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await page.locator('#quick-screen-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('screen-focus');
  await expect(page.locator('#screen-focus-canvas')).toBeFocused();
  const matchesLiveLcd = () => page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const actual = document.getElementById('screen-focus-canvas');
    const reference = new OffscreenCanvas(view.source.width, view.source.height);
    const context = reference.getContext('2d');
    context.drawImage(view.source, 0, 0);
    if (actual.width !== reference.width || actual.height !== reference.height) return false;
    const expected = context.getImageData(0, 0, reference.width, reference.height).data;
    const pixels = actual.getContext('2d').getImageData(0, 0, actual.width, actual.height).data;
    return expected.some((value, index) => index % 4 !== 3 && value > 100) &&
      pixels.every((value, index) => value === expected[index]);
  });
  await expect.poll(matchesLiveLcd).toBe(true);
  const before = await nativeFrame(page);
  await page.keyboard.down('ArrowRight');
  try { await expect.poll(async () => (await nativeFrame(page)).left).toBeGreaterThan(before.left); }
  finally { await page.keyboard.up('ArrowRight'); }
  await expect.poll(matchesLiveLcd).toBe(true);
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBe(identity);
  for (const [width, height] of [[1920, 1080], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const bounds = () => page.evaluate(() => {
      const rect = id => {
        const { x, y, width, height, bottom, right } = document.getElementById(id).getBoundingClientRect();
        return { x, y, width, height, bottom, right };
      };
      return { bezel: rect('screen-focus-bezel'), lcd: rect('screen-focus-canvas'),
        zoom: document.querySelector('.screen-focus-zoom').getBoundingClientRect().top };
    });
    await page.locator('#screen-focus-zoom').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#screen-focus-zoom-value')).toHaveText('100%');
    const fitted = await bounds();
    expect(fitted.lcd.width / fitted.lcd.height).toBeCloseTo(1.5, 2);
    expect(fitted.bezel.width / fitted.bezel.height).toBeCloseTo(447 / 339, 2);
    expect(fitted.bezel.x).toBeGreaterThanOrEqual(0);
    expect(fitted.bezel.y).toBeGreaterThanOrEqual(0);
    expect(fitted.bezel.right).toBeLessThanOrEqual(width);
    expect(fitted.bezel.bottom).toBeLessThanOrEqual(fitted.zoom);
    expect(fitted.lcd.y).toBeGreaterThan(fitted.bezel.y);
    expect(fitted.lcd.bottom).toBeLessThan(fitted.bezel.bottom);
    await page.keyboard.press('Home');
    await expect(page.locator('#screen-focus-zoom-value')).toHaveText('50%');
    const smaller = await bounds();
    expect(smaller.lcd.width / fitted.lcd.width).toBeCloseTo(.5, 2);
    expect(smaller.lcd.height / fitted.lcd.height).toBeCloseTo(.5, 2);
    expect(smaller.bezel.width / fitted.bezel.width).toBeCloseTo(.5, 2);
    await expect.poll(matchesLiveLcd).toBe(true);
    if (width === 1920) {
      await page.screenshot({ path: test.info().outputPath('screen-fullscreen-zoom-50.png') });
      expect(fitted.bezel.x).toBeGreaterThan(width * .1);
    }
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#screen-focus-zoom')).toHaveValue('51');
    await page.keyboard.press('End');
    await expect(page.locator('.screen-focus-wordmark')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`screen-fullscreen-fit-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: test.info().outputPath('screen-only-fullscreen.png') });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await expect(page.locator('#tools')).not.toBeVisible();
  await expect(page.locator('#screen-focus')).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'table');
  await page.locator('#quick-screen-fullscreen').click();
  await expect(page.locator('#screen-focus-canvas')).toBeFocused();
  await page.locator('#screen-focus-close').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await expect(page.locator('#screen-focus')).toBeHidden();
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBe(identity);
});

test('quick actions persist autosave off, restore selected slots and perform a safe physical restart', async ({ page }) => {
  await demoWithAutosaveOff(page);
  let frame = runtime(page);
  const identity = await frame.evaluate(() => window.runtimeIdentity = crypto.randomUUID());
  await page.locator('#quick-slots').click();
  await page.locator('#checkpoint-slot').selectOption('manual2');
  await page.locator('#pause').click();
  await page.locator('#tools-close').click();
  const saved = await frame.evaluate(() => window.EJS_emulator.canvas.toDataURL());
  await page.locator('#quick-save').click();
  await expect(page.locator('#notice')).toContainText('Slot 2');
  await page.locator('#quick-load').click();
  await expect(page.locator('#notice')).toContainText('restored');
  expect(await frame.evaluate(() => window.EJS_emulator.canvas.toDataURL())).toBe(saved);
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBe(identity);
  await page.waitForTimeout(16000);
  const records = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('bowser-boy-advance');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('games');
      const get = tx.objectStore('games').getAll();
      get.onsuccess = () => resolve(get.result.map(record => ({ manual2: !!record.manual2, automatic: !!record.automatic })));
      tx.oncomplete = () => db.close();
    };
  }));
  expect(records).toEqual([{ manual2: true, automatic: false }]);
  await page.locator('#quick-restart').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#scene')).toHaveAttribute('data-booting', 'true');
  await expect(page.locator('#pause')).toBeEnabled({ timeout: 90000 });
  await demoReady(page);
  frame = runtime(page);
  expect(await frame.evaluate(() => window.runtimeIdentity)).toBeUndefined();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await ready(page);
  await expect(page.locator('#pause')).toBeEnabled();
  await expect(page.locator('#quick-autosave')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#quick-slots').click();
  await page.locator('#checkpoint-slot').selectOption('manual2');
  await expect(page.locator('#restore')).toBeEnabled();
});

test('orbital startup draws supplied image and moving stars, with a stable reduced-motion frame', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  const artwork = await page.evaluate(async () => {
    const { drawStartup } = await import('./src/startup.js');
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 640;
    const context = canvas.getContext('2d');
    const images = [], starBounds = [], logoBounds = [];
    let columns = [];
    const draw = context.drawImage.bind(context);
    context.drawImage = (image, ...args) => {
      const name = image.src.split('/').pop();
      images.push(name);
      if (name === 'logo.png') {
        const [x, y, width, height] = args.length === 8 ? args.slice(4) : args;
        columns.push({ x, y, width, height, blur: context.shadowBlur });
      }
      if (name === 'star.png') {
        const [x, y, width, height] = args;
        const transform = context.getTransform();
        starBounds.push(...[[x, y], [x + width, y], [x, y + height], [x + width, y + height]]
          .map(([px, py]) => new DOMPoint(px, py).matrixTransform(transform))
          .map(point => ({ x: point.x / 4, y: point.y / 4 })));
      }
      draw(image, ...args);
    };
    const render = (elapsed, reduced = false) => {
      columns = [];
      drawStartup(canvas, elapsed, reduced);
      const left = Math.min(...columns.map(column => column.x));
      const right = Math.max(...columns.map(column => column.x + column.width));
      const width = right - left;
      logoBounds.push({ x: left, width,
        centerY: columns.reduce((sum, column) => sum + (column.y + column.height / 2) * column.width, 0) / width,
        wave: Math.max(...columns.map(column => column.y)) - Math.min(...columns.map(column => column.y)),
        blur: Math.max(...columns.map(column => column.blur)), reduced });
    };
    render(1200);
    const first = canvas.toDataURL();
    render(1800);
    const moved = canvas.toDataURL() !== first;
    render(0, true);
    const reduced = canvas.toDataURL();
    render(2000, true);
    const stable = canvas.toDataURL() === reduced;
    const renderedImages = [...images];
    const { starImage } = await import('./src/brand.js');
    const sprite = new OffscreenCanvas(starImage.width, starImage.height);
    const spriteContext = sprite.getContext('2d');
    spriteContext.drawImage(starImage, 0, 0);
    const { data } = spriteContext.getImageData(0, 0, sprite.width, sprite.height);
    const padded = Array.from({ length: sprite.width * sprite.height }, (_, pixel) => {
      const x = pixel % sprite.width, y = Math.floor(pixel / sprite.width);
      return (x >= 16 && x < sprite.width - 16 && y >= 16 && y < sprite.height - 16) ||
        data[pixel * 4 + 3] === 0;
    }).every(Boolean);
    for (let elapsed = 0; elapsed <= 3200; elapsed += 100) render(elapsed);
    return { images: renderedImages, moved, stable, image: reduced, padded, starBounds, logoBounds };
  });
  expect(artwork.images).toContain('logo.png');
  expect(artwork.images).toContain('orbit.png');
  expect(artwork.images).toContain('glow.png');
  expect(artwork.images.filter(name => name === 'star.png').length).toBe(12);
  expect(artwork.moved).toBe(true);
  expect(artwork.stable).toBe(true);
  expect(artwork.padded).toBe(true);
  expect(artwork.starBounds.every(point => point.x >= 0 && point.x <= 240 && point.y >= 0 && point.y <= 160)).toBe(true);
  for (const logo of artwork.logoBounds) {
    expect(logo.width).toBeLessThan(226 * .75);
    expect(logo.x + logo.width / 2).toBeCloseTo(120);
    expect(logo.centerY).toBeCloseTo(78);
    expect(logo.blur).toBe(0);
  }
  expect(artwork.logoBounds[0].wave).toBeGreaterThan(5);
  expect(artwork.logoBounds.filter(logo => logo.reduced).every(logo => logo.wave === 0)).toBe(true);
  await test.info().attach('orbital-startup-raster', { body: Buffer.from(artwork.image.split(',')[1], 'base64'), contentType: 'image/png' });
});

test('molded controls and metallic chroma logo retain physical branding, and frosted notices overlay without reframing the handheld', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.locator('#pickup').click();
  const branding = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Raycaster, Vector3 } = await import('three');
    const { brandImage } = await import('./src/brand.js');
    const bezel = view.model.root.getObjectByName('Metallic chroma bezel wordmark');
    const canvas = bezel.material.map.image;
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const fullscreen = document.querySelector('#screen-focus-wordmark');
    const fullscreenPixels = fullscreen.getContext('2d').getImageData(0, 0, fullscreen.width, fullscreen.height).data;
    let ink = 0, colored = 0, darkest = 255, brightest = 0;
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
    for (let i = 0; i < pixels.length; i += 4) {
      if (!pixels[i + 3]) continue;
      ink++;
      if (pixels[i] !== pixels[i + 1] || pixels[i + 1] !== pixels[i + 2]) colored++;
      if (pixels[i + 3] > 200) {
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        darkest = Math.min(darkest, brightness);
        brightest = Math.max(brightest, brightness);
      }
      const x = i / 4 % canvas.width, y = Math.floor(i / 4 / canvas.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const maker = view.model.root.getObjectByName('Zanark embossed maker mark');
    const letters = maker.getObjectByName('Raised Zanark lettering');
    letters.geometry.computeBoundingBox();
    const root = view.model.root;
    root.updateWorldMatrix(true, true);
    const cover = root.getObjectByName('Battery cover');
    const back = root.getObjectByName('Orbital battery-cover logo');
    back.geometry.computeBoundingBox();
    const backImage = back.material.map.image;
    const backPixels = backImage.getContext('2d').getImageData(0, 0, backImage.width, backImage.height).data;
    const referenceLogo = document.createElement('canvas');
    referenceLogo.width = backImage.width;
    referenceLogo.height = backImage.height;
    const originalLogo = referenceLogo.getContext('2d');
    originalLogo.drawImage(brandImage, 0, 0, backImage.width, backImage.height);
    const originalPixels = originalLogo.getImageData(0, 0, backImage.width, backImage.height).data;
    const towardBack = new Vector3(0, 0, 1).transformDirection(cover.matrixWorld);
    const blank = new Raycaster(cover.localToWorld(new Vector3(1.75, -.35, -1)), towardBack)
      .intersectObject(root, true)[0];
    const backPositions = back.geometry.getAttribute('position');
    const backUv = back.geometry.getAttribute('uv');
    const backIndices = back.geometry.getIndex();
    const depths = [], floorHits = [];
    for (let i = 0; i < (backIndices?.count ?? backPositions.count) && depths.length < 8; i += 3) {
      const vertices = [0, 1, 2].map(j => backIndices ? backIndices.getX(i + j) : i + j);
      const u = vertices.reduce((sum, index) => sum + backUv.getX(index), 0) / 3;
      const v = vertices.reduce((sum, index) => sum + backUv.getY(index), 0) / 3;
      const pixel = (Math.min(backImage.height - 1, Math.max(0, Math.floor((1 - v) * backImage.height))) * backImage.width +
        Math.min(backImage.width - 1, Math.max(0, Math.floor(u * backImage.width)))) * 4;
      if (backPixels[pixel + 3] < 240 || Math.max(...backPixels.subarray(pixel, pixel + 3)) < 200) continue;
      const point = vertices.reduce((sum, index) => sum.add(new Vector3().fromBufferAttribute(backPositions, index)), new Vector3())
        .multiplyScalar(1 / 3);
      point.z += .2;
      const hit = new Raycaster(back.localToWorld(point), new Vector3(0, 0, -1).transformDirection(back.matrixWorld))
        .intersectObject(root, true)[0];
      floorHits.push(hit?.object === back);
      depths.push(hit && blank ? cover.worldToLocal(hit.point.clone()).z - cover.worldToLocal(blank.point.clone()).z : null);
    }
    const backWalls = root.getObjectByName('Rear logo groove walls');
    backWalls?.geometry.computeBoundingBox();
    const rear = {
      width: (back.geometry.boundingBox.max.x - back.geometry.boundingBox.min.x) * back.scale.x,
      parented: cover.getObjectByName(back.name) === back,
      originalPixels: backPixels.every((value, index) => value === originalPixels[index]),
      unattenuated: back.material.type === 'MeshBasicMaterial' && !back.material.toneMapped &&
        back.material.opacity === 1 && back.material.color.getHexString() === 'ffffff',
      blank: blank?.object.name, depths, floorHits,
      wallDepth: backWalls ? backWalls.geometry.boundingBox.max.z - backWalls.geometry.boundingBox.min.z : null,
    };
    const luminance = color => .2126 * color.r + .7152 * color.g + .0722 * color.b;
    const recesses = ['a', 'b'].map(id => {
      const cap = view.model.controls.get(id).mesh;
      const floor = cap.getObjectByName(`Recessed ${id.toUpperCase()} lettering`);
      const walls = cap.getObjectByName(`${id.toUpperCase()} groove walls`);
      if (!floor || !walls) return null;
      const surface = (x, y) => {
        const ray = new Raycaster(cap.localToWorld(new Vector3(x, y, .2)),
          new Vector3(0, 0, -1).transformDirection(cap.matrixWorld));
        const hit = ray.intersectObject(cap, true)[0];
        return hit ? { mesh: hit.object, z: cap.worldToLocal(hit.point.clone()).z } : null;
      };
      const groove = surface(id === 'a' ? 0 : -.045, id === 'a' ? -.02 : 0);
      const blank = surface(.12, 0);
      const counter = surface(id === 'a' ? 0 : -.0075, id === 'a' ? .02 : .04);
      const reference = document.createElement('canvas');
      reference.width = Math.ceil(128 * .25 / .28);
      reference.height = 128;
      const expected = reference.getContext('2d');
      expected.font = 'bold 95px Arial';
      expected.fillStyle = '#fff';
      expected.textAlign = 'center';
      expected.textBaseline = 'middle';
      expected.fillText(id.toUpperCase(), reference.width / 2, reference.height / 2, reference.width - 18);
      const actual = document.createElement('canvas');
      actual.width = reference.width;
      actual.height = reference.height;
      const raster = actual.getContext('2d');
      const positions = floor.geometry.getAttribute('position');
      const indices = floor.geometry.getIndex();
      raster.beginPath();
      for (let i = 0; i < indices.count; i += 3) {
        for (let j = 0; j < 3; j++) {
          const index = indices.getX(i + j);
          const x = (positions.getX(index) / .25 + .5) * actual.width;
          const y = (.5 - (positions.getY(index) + .005) / .28) * actual.height;
          if (j === 0) raster.moveTo(x, y);
          else raster.lineTo(x, y);
        }
        raster.closePath();
      }
      raster.fillStyle = '#fff';
      raster.fill();
      const expectedPixels = expected.getImageData(0, 0, reference.width, reference.height).data;
      const actualPixels = raster.getImageData(0, 0, actual.width, actual.height).data;
      let intersection = 0, union = 0;
      for (let i = 3; i < expectedPixels.length; i += 4) {
        intersection += Math.min(expectedPixels[i], actualPixels[i]);
        union += Math.max(expectedPixels[i], actualPixels[i]);
      }
      walls.geometry.computeBoundingBox();
      return {
        floorReached: groove?.mesh === floor,
        depth: groove && blank ? blank.z - groove.z : null,
        counterAtCap: counter && blank ? Math.abs(counter.z - blank.z) < .004 && counter.mesh !== floor : false,
        wallDepth: walls.geometry.boundingBox.max.z - walls.geometry.boundingBox.min.z,
        contrast: (luminance(cap.material.color) + .05) / (luminance(floor.material.color) + .05),
        unprinted: floor.material.map === null && walls.material.map === null,
        shadowed: floor.receiveShadow && walls.castShadow && walls.receiveShadow,
        referenceTypographyOverlap: intersection / union,
      };
    });
    const markings = [
      ...['l', 'r'].map(id => {
        const cap = view.model.controls.get(id).mesh;
        return [cap.getObjectByName(`Raised ${id.toUpperCase()} lettering`), cap.material];
      }),
      ...['START', 'SELECT'].map(text =>
        [root.getObjectByName(`Raised ${text} lettering`), root.getObjectByName('Front face with speaker apertures').material]),
      ...['up', 'down', 'left', 'right'].map(id =>
        [root.getObjectByName(`Raised ${id} arrow`), view.model.controls.get(id).mesh.material, true]),
    ].map(([mesh, material, darker = false]) => {
      if (!mesh) return null;
      mesh.geometry.computeBoundingBox();
      return { geometry: mesh.geometry.type, depth: mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z,
        sameMaterial: mesh.material === material, unprinted: mesh.material.map === null,
        darker, contrast: (luminance(material.color) + .05) / (luminance(mesh.material.color) + .05),
        castsShadow: mesh.castShadow, receivesShadow: mesh.receiveShadow };
    });
    const microLabels = [[3.38, 1.43], [-3.02, -1.95]].map(([x, y]) => {
      const ray = new Raycaster(root.localToWorld(new Vector3(x, y, 2)),
        new Vector3(0, 0, -1).transformDirection(root.matrixWorld));
      return !!ray.intersectObject(root, true)[0]?.object.material.map;
    });
    return { ink, colored, chromeRange: brightest - darkest, rear,
      inkBounds: { left: minX / canvas.width, top: minY / canvas.height,
        right: (maxX + 1) / canvas.width, bottom: (maxY + 1) / canvas.height },
      depth: letters.geometry.boundingBox.max.z - letters.geometry.boundingBox.min.z,
      samePlastic: letters.material === view.model.root.getObjectByName('Front face with speaker apertures').material,
      sameFullscreenWordmark: canvas.width === fullscreen.width && canvas.height === fullscreen.height &&
        pixels.every((value, index) => value === fullscreenPixels[index]), recesses, markings, microLabels };
  });
  await test.info().attach('rear-logo-geometry', { body: JSON.stringify(branding.rear), contentType: 'application/json' });
  expect(branding.ink).toBeGreaterThan(1000);
  expect(branding.colored).toBeGreaterThan(branding.ink * .8);
  expect(branding.chromeRange).toBeGreaterThan(100);
  expect(branding.inkBounds.left).toBeGreaterThanOrEqual(.21);
  expect(branding.inkBounds.top).toBeGreaterThanOrEqual(.26);
  expect(branding.inkBounds.right).toBeLessThanOrEqual(.79);
  expect(branding.inkBounds.bottom).toBeLessThanOrEqual(.69);
  expect(branding.inkBounds.right - branding.inkBounds.left).toBeGreaterThan(.52);
  expect(branding.depth).toBeGreaterThan(.018);
  expect(branding.samePlastic).toBe(true);
  expect(branding.sameFullscreenWordmark).toBe(true);
  expect(branding.rear.width).toBeGreaterThan(3.25);
  expect(branding.rear.width).toBeLessThan(3.5);
  expect(branding.rear.parented && branding.rear.originalPixels && branding.rear.unattenuated).toBe(true);
  expect(branding.rear.blank).toBe('Engraved battery-cover face');
  expect(branding.rear.depths).toHaveLength(8);
  expect(branding.rear.floorHits.every(Boolean)).toBe(true);
  for (const depth of branding.rear.depths) {
    expect(depth).toBeGreaterThan(.02);
    expect(depth).toBeLessThan(.028);
  }
  expect(branding.rear.wallDepth).toBeGreaterThan(.02);
  expect(branding.rear.wallDepth).toBeLessThan(.028);
  expect(branding.microLabels).toEqual([false, false]);
  expect(branding.recesses).toHaveLength(2);
  for (const recess of branding.recesses) {
    expect(recess).not.toBeNull();
    expect(recess.floorReached).toBe(true);
    expect(recess.depth).toBeGreaterThan(.004);
    expect(recess.depth).toBeLessThan(.012);
    expect(recess.counterAtCap).toBe(true);
    expect(recess.wallDepth).toBeGreaterThan(.004);
    expect(recess.wallDepth).toBeLessThan(.012);
    expect(recess.contrast).toBeGreaterThan(1.5);
    expect(recess.contrast).toBeLessThan(2.5);
    expect(recess.unprinted && recess.shadowed).toBe(true);
    expect(recess.referenceTypographyOverlap).toBeGreaterThan(.94);
  }
  expect(branding.markings).toHaveLength(8);
  for (const marking of branding.markings) {
    expect(marking).not.toBeNull();
    expect(marking.geometry).toBe('ExtrudeGeometry');
    expect(marking.depth).toBeGreaterThan(.008);
    expect(marking.sameMaterial).toBe(!marking.darker);
    if (marking.darker) expect(marking.contrast).toBeGreaterThan(1.5);
    expect(marking.unprinted && marking.castsShadow && marking.receivesShadow).toBe(true);
  }
  const icons = await page.locator('.scene-actions button:visible svg path').evaluateAll(paths => paths.map(path => path.getAttribute('d')));
  expect(new Set(icons).size).toBe(icons.length);
  await powerOn(page);
  await expect(page.locator('#notice')).toBeVisible();
  await expect(page.locator('.desk-heading h1')).toBeHidden();
  const ordinaryFit = async () => {
    await expect.poll(() => page.evaluate(async () => {
      const { view } = await import('./src/app.js');
      const { Vector3 } = await import('three');
      const dock = document.querySelector('.scene-actions').getBoundingClientRect();
      const power = document.querySelector('#hardware-power');
      const target = power.getBoundingClientRect();
      const points = [];
      view.model.root.traverseVisible(mesh => {
        const positions = mesh.geometry?.getAttribute('position');
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
          const point = mesh.localToWorld(new Vector3().fromBufferAttribute(positions, i)).project(view.camera);
          points.push({ x: (point.x + 1) * view.width / 2, y: (1 - point.y) * view.height / 2 });
        }
      });
      const inserting = view.mode === 'playing' && !!view.cartridgeMotion;
      const closePlay = view.mode === 'playing' && !inserting;
      const distance = Math.max((closePlay ? 9.8 : 10.2) / view.camera.aspect,
        (inserting ? 8.3 : closePlay ? 5.35 : 5.55) * view.height / Math.max(160, view.height - 180)) /
        (2 * Math.tan(view.camera.fov * Math.PI / 360)) * view.zoom;
      const targetY = view.playTarget.y + (inserting ? 1.05 : 0) + (closePlay ? -.12 : 0);
      return {
        sides: points.every(p => p.x >= 4 && p.x <= innerWidth - 4),
        top: points.every(p => p.y >= 4),
        dock: points.every(p => p.y < dock.top),
        power: power.hidden || (target.width >= 44 && target.height >= 44 && target.left >= 0 &&
          target.right <= innerWidth && target.bottom <= dock.top),
        framing: Math.abs(view.camera.position.x) < 1e-5 &&
          Math.abs(view.camera.position.y - targetY - .1) < 1e-5 &&
          Math.abs(view.camera.position.z - distance) < 1e-5 &&
          Math.abs(view.lookAt.x - view.playTarget.x) < 1e-5 &&
          Math.abs(view.lookAt.y - targetY) < 1e-5 &&
          Math.abs(view.lookAt.z - view.playTarget.z) < 1e-5,
      };
    }), { message: 'Overlay notices preserve ordinary handheld framing, viewport fit and dock clearance' })
      .toEqual({ sides: true, top: true, dock: true, power: true, framing: true });
  };
  for (const [width, height] of [[1920, 1080], [1440, 1100], [844, 390], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const logo = await page.locator('.desk-heading h1').boundingBox();
    const notice = await page.locator('#notice').boundingBox();
    expect(notice.y).toBeGreaterThanOrEqual(logo.y + logo.height);
    expect(notice.x).toBeCloseTo(logo.x);
    expect(notice.x + notice.width).toBeLessThanOrEqual(width);
    await ordinaryFit();
    await page.screenshot({ path: test.info().outputPath(`frosted-notice-${width}.png`) });
  }
  const glass = await page.locator('#notice').evaluate(element => {
    const style = getComputedStyle(element);
    return { blur: style.backdropFilter, background: style.backgroundColor };
  });
  expect(glass.blur).toContain('blur(18px)');
  expect(glass.background).toMatch(/^rgba\(.+, 0\.\d+\)$/);
  await page.locator('#rom-file').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not a ROM') });
  await expect(page.locator('#notice')).toHaveClass('notice error');
  await page.evaluate(() => {
    document.querySelector('#notice-text').textContent =
      'This long notification fixture checks wrapping and scrolling without reframing the handheld. '.repeat(12);
  });
  for (const [width, height] of [[844, 390], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await ordinaryFit();
    await expect(page.locator('#notice-dismiss')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: test.info().outputPath(`frosted-long-error-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('#tools-open').click();
  await expect(page.locator('#drawer-notice-host #notice')).toBeVisible();
  const ordinaryDistance = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    return Math.max(9.8 / view.camera.aspect, 5.35 * view.height / (view.height - 180)) /
      (2 * Math.tan(view.camera.fov * Math.PI / 360));
  });
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.camera.position.z))
    .toBeCloseTo(ordinaryDistance, 5);
  await page.locator('#tools-close').click();
  await ordinaryFit();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'inspecting');
  await ordinaryFit();
  await page.locator('#inspect').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
  await page.locator('#notice-dismiss').click();
  await expect(page.locator('#notice')).toBeHidden();
  await expect.poll(() => page.evaluate(async () => (await import('./src/app.js')).view.camera.position.z))
    .toBeCloseTo(ordinaryDistance, 5);
});
