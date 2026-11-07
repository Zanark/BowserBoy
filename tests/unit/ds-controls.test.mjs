import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3 } from 'three';
import { DsController } from '../../src/ds-controller.js';

function controller() {
  const dpad = new Group();
  dpad.position.z = dpad.userData.restZ = .285;
  const face = new Group();
  face.position.z = face.userData.restZ = .29;
  return Object.assign(Object.create(DsController.prototype), {
    model: { controls: new Map([
      ...['up', 'down', 'left', 'right'].map(id => {
        const restMaterial = {}, pressedMaterial = {};
        return [id, { mesh: dpad, indicator: { material: restMaterial }, restMaterial, pressedMaterial }];
      }),
      ['a', { mesh: face }],
    ]) },
    pressed: new Set(), view: { changed: false },
  });
}

function settle(pad, inputs, frames = 30) {
  pad.pressed = new Set(inputs);
  for (let frame = 0; frame < frames; frame++) pad.paint(frame * 1000 / frames, 1 / frames);
  return pad.model.controls.get('up').mesh;
}

test('DS cross rocks the pressed edge down, combines diagonals and cancels opposite directions', () => {
  const pad = controller();
  const height = (mesh, x, y) => mesh.localToWorld(new Vector3(x, y, .068)).z;
  for (const [inputs, vertical, horizontal] of [
    [['up'], -1, 0], [['down'], 1, 0], [['left'], 0, 1], [['right'], 0, -1],
    [['up', 'right'], -1, -1], [['down', 'left'], 1, 1],
    [['up', 'down'], 0, 0], [['left', 'right'], 0, 0],
    [['up', 'down', 'right'], 0, -1],
  ]) {
    const mesh = settle(pad, inputs);
    const v = height(mesh, 0, .5) - height(mesh, 0, -.5);
    const h = height(mesh, .5, 0) - height(mesh, -.5, 0);
    assert.ok(vertical ? v * vertical > .1 : Math.abs(v) < .00001);
    assert.ok(horizontal ? h * horizontal > .1 : Math.abs(h) < .00001);
    assert.ok(mesh.position.z < mesh.userData.restZ);
    assert.ok(Math.hypot(mesh.rotation.x, mesh.rotation.y) <= .16001);
    for (const [id, control] of pad.model.controls) {
      if (control.indicator) assert.equal(control.indicator.material,
        inputs.includes(id) ? control.pressedMaterial : control.restMaterial);
    }
    for (const [x, y] of [[0, .54], [0, -.54], [-.54, 0], [.54, 0]]) {
      assert.ok(height(mesh, x, y) > .235, 'pressed cap surface remains above the deck');
    }
  }
  settle(pad, ['right', 'a']);
  assert.equal(pad.model.controls.get('a').mesh.position.z, .29 - .065);
  const mesh = settle(pad, []);
  assert.deepEqual(mesh.rotation.toArray(), [0, 0, 0, 'XYZ']);
  assert.equal(mesh.position.z, mesh.userData.restZ);
  assert.equal(pad.model.controls.get('a').mesh.position.z, .29);
  for (const control of pad.model.controls.values()) {
    if (control.indicator) assert.equal(control.indicator.material, control.restMaterial);
  }
  pad.view.changed = false;
  pad.paint(1100, 1 / 60);
  assert.equal(pad.view.changed, false, 'settled feedback does not keep idle rendering active');
});

test('DS rocking is elapsed-time based and a slow paint reaches the correct pose without overshoot', () => {
  const slow = controller(), fast = controller();
  const a = settle(slow, ['up', 'right'], 20);
  const b = settle(fast, ['up', 'right'], 120);
  assert.deepEqual(a.rotation.toArray(), b.rotation.toArray());
  assert.equal(a.position.z, b.position.z);
  slow.pressed.clear();
  slow.paint(2000, 2);
  assert.deepEqual(a.rotation.toArray(), [0, 0, 0, 'XYZ']);
  assert.equal(a.position.z, a.userData.restZ);
});
