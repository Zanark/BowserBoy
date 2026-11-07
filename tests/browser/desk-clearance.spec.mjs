import { test, expect } from '@playwright/test';
import { installRoomPaintFixture, waitForDesk } from './pixel-lab.mjs';

async function ready(page) {
  await page.goto('./');
  await waitForDesk(page);
  await expect(page.locator('#consoles-open')).toBeEnabled();
  await expect.poll(() => page.evaluate(async () =>
    Number.isFinite((await import('./src/app.js')).view.lastPaint))).toBe(true);
  await page.evaluate(async () => (await import('./src/app.js')).view.renderer.setAnimationLoop(null));
}

test('table Pear placement displaces loose props before consoles and props return to their anchors', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { view } = await import('./src/app.js');
    const { Box3, Vector3 } = await import('three');
    const bounds = root => new Box3().setFromObject(root);
    const overlaps = (a, b) => bounds(a).intersectsBox(bounds(b));
    const prop = view.deskObjects[0], consoleRoot = view.model.root;
    const pearHome = view.pear.root.position.clone();
    const propHome = view.deskPropHomes.get(prop).clone();
    const rotations = [consoleRoot, view.ds.root].map(root => root.quaternion.toArray());
    const lamp = view.lamp.root.position.toArray();
    const accepted = view.movePearTo(new Vector3(propHome.x, 0, propHome.z));
    const pear = view.pear.root.position.toArray();
    consoleRoot.position.x = propHome.x;
    consoleRoot.position.z = propHome.z;
    const before = { pearProp: overlaps(view.pear.root, prop), pearConsole: overlaps(view.pear.root, consoleRoot) };
    const resolved = view.resolveDeskClearance(false);
    const displacedProp = prop.position.clone();
    const after = {
      pear: view.pear.root.position.toArray(),
      pearProp: overlaps(view.pear.root, prop), pearConsole: overlaps(view.pear.root, consoleRoot),
      propConsole: overlaps(prop, consoleRoot),
      propMoved: !prop.position.equals(propHome),
    };
    consoleRoot.position.x = prop.position.x;
    consoleRoot.position.z = prop.position.z;
    const consolePropOverlap = overlaps(consoleRoot, prop);
    const propsWin = view.resolveDeskClearance(false);
    const retainedProp = prop.position.equals(displacedProp);
    const retainedPropPosition = prop.position.toArray();
    const consoleYields = !overlaps(consoleRoot, prop);
    view.beginConsoleMove('gba');
    const rejected = !view.moveConsoleTo(view.pear.root.position.clone());
    view.finishConsoleMove(true);
    view.pearMotion.reset(pearHome);
    const restored = view.resolveDeskClearance(false);
    return {
      accepted, before, resolved, pear, after, consolePropOverlap, propsWin, retainedProp, consoleYields,
      displacedProp: displacedProp.toArray(), retainedPropPosition,
      rejected, restored, propHome: propHome.toArray(), prop: prop.position.toArray(),
      rotations, finalRotations: [consoleRoot, view.ds.root].map(root => root.quaternion.toArray()),
      lamp, finalLamp: view.lamp.root.position.toArray(),
      visible: [view.pear.root, consoleRoot, view.ds.root, ...view.deskObjects].every(root => root.visible),
    };
  });
  expect(result.accepted).toBe(true);
  expect(result.before).toEqual({ pearProp: true, pearConsole: true });
  expect(result.resolved).toBe(true);
  expect(result.after).toEqual({
    pear: result.pear, pearProp: false, pearConsole: false, propConsole: false, propMoved: true,
  });
  expect(result.consolePropOverlap).toBe(true);
  expect(result.propsWin && result.retainedProp && result.consoleYields).toBe(true);
  expect(result.rejected).toBe(true);
  expect(result.restored).toBe(true);
  expect(result.prop).toEqual(result.propHome);
  expect(result.finalRotations).toEqual(result.rotations);
  expect(result.finalLamp).toEqual(result.lamp);
  expect(result.visible).toBe(true);
});

for (const system of ['gba', 'ds']) {
  test(`${system} focus enforces real geometry clearance at paint and restores table priorities`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await installRoomPaintFixture(page);
    const result = await page.evaluate(async system => {
      const { view } = await import('./src/app.js');
      const { Box3, Vector3 } = await import('three');
      const bounds = root => new Box3().setFromObject(root);
      const overlaps = (a, b) => bounds(a).intersectsBox(bounds(b));
      const pose = root => ({ position: root.position.toArray(), rotation: root.quaternion.toArray() });
      const saved = () => Object.fromEntries(['gba', 'ds'].map(key => [key, {
        position: view.consolePoses[key].position.toArray(), rotation: view.consolePoses[key].rotation.toArray(),
      }]));
      const paint = async () => {
        view.changed = true;
        await window.roomPaintFixture.waitForGpu();
        await window.roomPaintFixture.waitForRecovery();
        // Retiring a completed fence can establish a new recovery boundary.
        view.render(Math.max(performance.now(), view.nextPaint, (view.lastRender ?? 0) + 16.67));
        if (!view.renderedLastFrame)
          await window.roomPaintFixture.paint(Math.max(view.nextPaint, view.lastRender + 16.67));
      };
      const prop = view.deskObjects[0], propHome = view.deskPropHomes.get(prop);
      if (!view.movePearTo(new Vector3(propHome.x, 0, propHome.z)) || !view.resolveDeskClearance(false))
        throw new Error('Could not establish overlapping Pear/prop table placement.');
      const tablePear = view.pear.root.position.toArray();
      const authored = saved();
      const tableRotations = [view.model.root, view.ds.root].map(root => root.quaternion.toArray());
      const lamp = pose(view.lamp.root);
      view.selectConsole(system);
      await paint();
      const active = view.activeModel.root;
      const inactive = system === 'gba' ? view.ds.root : view.model.root;
      const activePose = pose(active), hinge = view.ds.lid.rotation.x;
      inactive.position.copy(active.position);
      view.pearMotion.reset(new Vector3(active.position.x, 0, active.position.z));
      const forced = {
        consoles: overlaps(active, inactive), pear: overlaps(active, view.pear.root),
        sleeping: view.pearMotion.sleeping,
      };
      const originalRender = view.renderer.render;
      const samples = [];
      view.renderer.render = function(scene, camera) {
        if (scene === view.scene && camera === view.camera) samples.push({
          mode: view.mode,
          consoles: overlaps(active, inactive),
          activePear: overlaps(active, view.pear.root),
          inactivePear: overlaps(inactive, view.pear.root),
          pearProp: overlaps(view.pear.root, prop),
          pear: view.pear.root.position.toArray(),
          active: pose(active),
          visible: [active, inactive, view.pear.root, prop].every(root => root.visible),
        });
        return originalRender.call(this, scene, camera);
      };
      try {
        const frame = view.renderer.info.render.frame;
        // No resolver call: this overlap must be repaired by the actual paint path.
        await paint();
        const automatic = samples.at(-1);
        const frameAdvanced = view.renderer.info.render.frame > frame;
        const focusSaved = saved();
        const focusHinge = view.ds.lid.rotation.x;
        const inactivePose = pose(inactive);
        view.pearMotion.reset(new Vector3(inactive.position.x, 0, inactive.position.z));
        const inactiveOverlap = overlaps(inactive, view.pear.root);
        const sleeping = view.pearMotion.sleeping;
        const inactiveResolved = view.resolveDeskClearance(true);
        const inactiveWins = {
          unchanged: JSON.stringify(pose(inactive)) === JSON.stringify(inactivePose),
          clear: !overlaps(inactive, view.pear.root), active: pose(active),
        };
        view.setView('inspecting');
        await paint();
        if (system === 'ds') view.setDsHinge(73);
        const inspectPose = pose(active), inspectHinge = view.ds.lid.rotation.x;
        view.pearMotion.reset(new Vector3(active.position.x, 0, active.position.z));
        const inspectOverlap = overlaps(active, view.pear.root);
        const inspectResolved = view.resolveDeskClearance(true);
        const inspection = {
          active: pose(active), hinge: view.ds.lid.rotation.x, clear: !overlaps(active, view.pear.root),
        };
        const inspectSaved = saved();
        view.setView('table');
        await paint();
        const tableSample = samples.at(-1);
        view.setView('playing');
        await paint();
        view.resetPearPosition();
        const resetPosition = view.pear.root.position.toArray();
        view.setView('table');
        await paint();
        const resetRestored = view.pear.root.position.toArray();
        view.setView('playing');
        await paint();
        view.setView('table');
        view.beginPearMove();
        const explicitPosition = new Vector3(...resetPosition).add(new Vector3(-1, 0, 0));
        const explicitAccepted = view.movePearTo(explicitPosition);
        await paint();
        const explicitRestored = {
          position: view.pear.root.position.toArray(), held: view.pearMotion.held,
        };
        view.finishPearMove(true);
        return {
          forced, activePose, hinge, automatic, frameAdvanced, authored, focusSaved, focusHinge,
          inactiveOverlap, sleeping, inactiveResolved, inactiveWins,
          inspectPose, inspectHinge, inspectOverlap, inspectResolved, inspection, inspectSaved,
          tablePear, tableSample, finalMode: view.host.dataset.view, transition: !!view.transition,
          resetPosition, resetRestored, explicitAccepted, explicitPosition: explicitPosition.toArray(), explicitRestored,
          tableRotations, finalRotations: [view.model.root, view.ds.root].map(root => root.quaternion.toArray()),
          lamp, finalLamp: pose(view.lamp.root),
        };
      } finally {
        view.renderer.render = originalRender;
      }
    }, system);
    expect(result.forced).toEqual({ consoles: true, pear: true, sleeping: true });
    expect(result.frameAdvanced).toBe(true);
    expect(result.automatic).toMatchObject({
      mode: 'playing', consoles: false, activePear: false, inactivePear: false,
      active: result.activePose, visible: true,
    });
    expect(result.focusSaved).toEqual(result.authored);
    expect(result.focusHinge).toBe(result.hinge);
    expect(result.inactiveOverlap && result.sleeping && result.inactiveResolved).toBe(true);
    expect(result.inactiveWins).toEqual({ unchanged: true, clear: true, active: result.activePose });
    expect(result.inspectOverlap && result.inspectResolved).toBe(true);
    expect(result.inspection).toEqual({ active: result.inspectPose, hinge: result.inspectHinge, clear: true });
    expect(result.inspectSaved).toEqual(result.authored);
    expect(result.tableSample).toMatchObject({
      mode: 'table', pear: result.tablePear, consoles: false, activePear: false,
      inactivePear: false, pearProp: false, visible: true,
    });
    expect(result.finalMode).toBe('table');
    expect(result.transition).toBe(false);
    expect(result.resetRestored).toEqual(result.resetPosition);
    expect(result.explicitAccepted).toBe(true);
    expect(result.explicitRestored).toEqual({ position: result.explicitPosition, held: true });
    expect(result.finalRotations).toEqual(result.tableRotations);
    expect(result.finalLamp).toEqual(result.lamp);
    if (system === 'ds') {
      await page.evaluate(async () => {
        const { view } = await import('./src/app.js');
        view.renderer.setAnimationLoop(time => view.render(time));
      });
      await page.locator('#select-ds').click();
      await expect(page.locator('#scene')).toHaveAttribute('data-view', 'playing');
      await page.screenshot({ path: testInfo.outputPath('ds-clearance-focus.png') });
    }
  });
}
