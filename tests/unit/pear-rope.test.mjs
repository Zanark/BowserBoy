import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CatmullRomCurve3, Vector3 } from 'three';
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

test('fixed steps produce the same rope trajectory at sub-Hz, 2Hz, 30 and 120Hz', () => {
  const regular = rope(), origin = new Vector3(0, 1, 1);
  simulate(regular, origin, 360, 120);
  for (const hz of [1 / 3, 2, 30]) {
    const sparse = rope();
    simulate(sparse, origin, 3 * hz, hz);
    regular.positions.forEach((point, i) => assert.ok(point.distanceTo(sparse.positions[i]) < 1e-8));
  }
});

test('rapid pointer moves constrain the pinned rope even between physics steps', () => {
  const a = rope();
  for (const origin of [new Vector3(0, 3, 0), new Vector3(4, 6, 2), new Vector3(-12, 12, -6)]) {
    a.update(origin, .001);
    constrained(a);
    assert.ok(a.positions[0].equals(a.rest[0].clone().add(origin)));
  }
});

test('legs hang over the finite tabletop, clear its front fascia, and rest on top farther back', () => {
  const curve = new CatmullRomCurve3([
    new Vector3(1.2, .65, 2.35), new Vector3(1.7, .4, 3.15), new Vector3(2.05, .36, 3.85),
  ]);
  const leg = new PearRope(curve.getSpacedPoints(6), {
    radiusAt: () => 0, radius: .14, tipRadius: .55, tipFloor: .36,
  });
  const edge = new Vector3(18, 0, 7.3);
  leg.settle(edge);
  assert.ok(leg.positions[0].equals(leg.rest[0].clone().add(edge)));
  assert.ok(leg.positions.at(-1).y < -.5, 'the foot must hang below the tabletop');
  assert.equal(leg.tipSupported, false);
  for (let i = 1; i < leg.positions.length; i++) {
    const point = leg.positions[i], radius = i === leg.positions.length - 1 ? .55 : .14;
    const floor = i === leg.positions.length - 1 ? .36 : .14;
    const corner = point.z > 10 && point.y > 0 &&
      Math.hypot((point.z - 10) / radius, point.y / floor) >= 1 - 1e-6;
    assert.ok(point.y >= floor - 1e-6 || point.z >= 10 + radius - 1e-6 || corner,
      'hanging rope and foot must not cut through the wooden front edge');
    assert.ok(Math.abs(point.distanceTo(leg.positions[i - 1]) - leg.lengths[i - 1]) < .02);
  }
  simulate(leg, new Vector3(18, 0, 1), 600);
  assert.equal(leg.tipSupported, true);
  constrained(leg);
  simulate(leg, edge, 600);
  assert.ok(leg.positions.at(-1).y < -.5);
  assert.equal(leg.sleeping, true);
});

test('a foot partly over the rounded desk edge slides off instead of resting on an invisible ledge', () => {
  const leg = new PearRope([new Vector3(0, .65, 9.9), new Vector3(1.9, .36, 10.48)], {
    radiusAt: () => 0, radius: .14, tipRadius: .55, tipFloor: .36,
  });
  leg.settle(new Vector3());
  assert.ok(leg.positions.at(-1).y < -.5);
  assert.ok(leg.positions.at(-1).z >= 10.55 - 1e-6);
  assert.equal(leg.tipSupported, false);
  assert.ok(Math.abs(leg.positions[0].distanceTo(leg.positions[1]) - leg.lengths[0]) < .02);
});
