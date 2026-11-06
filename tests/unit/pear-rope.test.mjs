import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { PearRope } from '../../src/pear-rope.js';

function rope() {
  return new PearRope(Array.from({ length: 7 }, (_, i) => new Vector3(3, 4 - i / 4, 0)), {
    radiusAt: () => 2.8,
  });
}
function simulate(rope, origin, frames = 120, hz = 60) {
  for (let i = 0; i < frames; i++) rope.update(origin, 1 / hz);
}
function constrained(rope) {
  for (let i = 1; i < rope.positions.length; i++) {
    const point = rope.positions[i];
    assert.ok(point.toArray().every(Number.isFinite));
    assert.ok(point.y >= (i === rope.positions.length - 1 ? rope.tipFloor : rope.radius) - 1e-6);
    assert.ok(Math.abs(point.distanceTo(rope.positions[i - 1]) - rope.lengths[i - 1]) < .02);
  }
}

test('rope pins its attachment, swings inertially after movement, then sleeps without stretching', () => {
  const a = rope(), origin = new Vector3(0, .35, .4);
  a.update(origin, 1 / 60);
  assert.deepEqual(a.positions[0].toArray(), [3, 4.35, .4]);
  assert.ok(a.positions.at(-1).z < .3, 'the hand must lag behind the picked-up body');
  const before = a.positions.at(-1).clone();
  simulate(a, origin, 15);
  assert.ok(before.distanceTo(a.positions.at(-1)) > .1);
  simulate(a, origin, 600);
  constrained(a);
  assert.equal(a.sleeping, true);
  assert.equal(a.update(origin, 1 / 60), false);
});

test('rope tolerates a stalled frame, collides with the body and desk, and reset removes stale momentum', () => {
  const a = rope(), origin = new Vector3(12, -2.6, -6);
  a.update(origin, 30);
  simulate(a, origin, 300);
  constrained(a);
  for (let i = 1; i < a.positions.length; i++) {
    assert.ok(Math.hypot(a.positions[i].x - origin.x, a.positions[i].z - origin.z) >= 2.8 + a.radius - .001);
  }
  a.reset(new Vector3());
  assert.equal(a.sleeping, true);
  assert.ok(a.positions.every((point, i) => point.equals(a.rest[i]) && point.equals(a.previous[i])));
});

test('fixed steps produce the same rope trajectory at 30 and 120Hz', () => {
  const a = rope(), b = rope(), origin = new Vector3(0, 1, 1);
  simulate(a, origin, 30, 30);
  simulate(b, origin, 120, 120);
  a.positions.forEach((point, i) => assert.ok(point.distanceTo(b.positions[i]) < 1e-8));
});

test('rapid pointer moves constrain the pinned rope even between physics steps', () => {
  const a = rope();
  for (const origin of [new Vector3(0, 3, 0), new Vector3(4, 6, 2), new Vector3(-12, 12, -6)]) {
    a.update(origin, .001);
    constrained(a);
    assert.ok(a.positions[0].equals(a.rest[0].clone().add(origin)));
  }
});
