import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { DeskMotion, PearMotion } from '../../src/pear-motion.js';

function settle(motion, obstacles = []) {
  for (let i = 0; i < 1800 && !motion.sleeping; i++) motion.update(1 / 120, obstacles);
  assert.equal(motion.sleeping, true);
}

test('sparse and multi-second callbacks retain the same falling trajectory and contacts as 120Hz', () => {
  const regular = new PearMotion(new Vector3(15, 15, -5));
  const obstacles = [new Box3(new Vector3(12, 0, -8), new Vector3(18, 3, -2))];
  for (let i = 0; i < 360; i++) regular.update(1 / 120, obstacles);
  for (const interval of [.5, 3]) {
    const sparse = new PearMotion(new Vector3(15, 15, -5));
    for (let i = 0; i < 3 / interval; i++) sparse.update(interval, obstacles);
    assert.ok(sparse.position.distanceTo(regular.position) < 1e-8);
    assert.ok(sparse.velocity.distanceTo(regular.velocity) < 1e-8);
    assert.equal(sparse.sleeping, true);
  }
});

test('a lifted pear falls, bounces and settles instead of snapping onto the desk', () => {
  const position = new Vector3(20, 0, -8), motion = new PearMotion(position);
  motion.pickUp();
  motion.moveTo(new Vector3(20, 10, -8), 0);
  motion.drop(200);
  motion.update(1 / 60, []);
  assert.ok(position.y > 9 && position.y < 10);
  let bounced = false;
  for (let i = 0; i < 300; i++) {
    motion.update(1 / 120, []);
    bounced ||= motion.velocity.y > 0;
    assert.ok(position.y >= 0);
  }
  assert.equal(bounced, true);
  settle(motion);
  assert.equal(position.y, 0);
  assert.deepEqual(motion.velocity.toArray(), [0, 0, 0]);
});

test('paint-aware drops retain falling and rising poses and pending physics until each is painted', () => {
  const motion = new PearMotion(new Vector3(20, 10, -8));
  motion.drop(200, { requirePaint: true });
  motion.update(3, []);
  assert.ok(motion.position.y > 0 && motion.position.y < 10);
  assert.ok(motion.velocity.y < 0);
  const falling = motion.position.clone(), pending = motion.accumulator;
  assert.equal(motion.update(.25, []), false);
  assert.ok(motion.position.equals(falling));
  assert.ok(motion.accumulator > pending);
  motion.acknowledgePaint();
  motion.update(0, []);
  assert.ok(motion.position.y > 0);
  assert.ok(motion.velocity.y > 0);
  const rising = motion.position.clone();
  assert.equal(motion.update(0, []), false);
  assert.ok(motion.position.equals(rising));
  motion.acknowledgePaint();
  motion.update(0, []);
  assert.equal(motion.sleeping, true);
  assert.equal(motion.position.y, 0);
  assert.equal(motion.accumulator, 0);
});

test('paint-aware drops respect raised supports and catching or resetting clears pending presentation', () => {
  const motion = new DeskMotion(new Vector3(0, 10, 0), {
    bounds: new Box3(new Vector3(-1, -.5, -1), new Vector3(1, 1, 1)),
    workspace: new Box3(new Vector3(-10, .5, -10), new Vector3(10, 25, 10)),
  });
  const obstacles = [new Box3(new Vector3(-2, 0, -2), new Vector3(2, 8, 2))];
  motion.drop(200, { requirePaint: true });
  motion.update(3, obstacles);
  assert.ok(motion.position.y > 8.5 && motion.position.y < 10);
  assert.ok(motion.velocity.y < 0);
  motion.pickUp();
  const held = motion.position.clone();
  assert.equal(motion.update(3, obstacles), false);
  assert.ok(motion.position.equals(held));
  motion.drop(400);
  motion.update(3, obstacles);
  assert.equal(motion.sleeping, true);
  assert.equal(motion.position.y, 8.5);
  motion.reset(new Vector3(0, 10, 0));
  motion.update(3, obstacles);
  assert.equal(motion.sleeping, true);
  assert.equal(motion.position.y, 8.5);
});

test('three-dimensional release inertia is bounded, and catching or cancelling removes stale motion', () => {
  const position = new Vector3(20, 0, -8), motion = new PearMotion(position);
  motion.pickUp();
  motion.moveTo(new Vector3(20, 4, -8), 0);
  motion.moveTo(new Vector3(21, 5, -7), 16);
  assert.ok(motion.velocity.x > 0 && motion.velocity.y > 0 && motion.velocity.z > 0);
  assert.ok(motion.velocity.length() <= 22.0001);
  motion.drop(20);
  motion.update(.05, []);
  assert.ok(position.x > 21 && position.y > 5 && position.z > -7);
  motion.pickUp();
  const held = position.clone();
  assert.equal(motion.update(10, []), false);
  assert.ok(position.equals(held));
  motion.reset(new Vector3(21.3, 0, -8));
  assert.equal(motion.sleeping, true);
  assert.deepEqual(motion.velocity.toArray(), [0, 0, 0]);
});

test('a dropped pear lands on a prop without tunnelling and cannot leave the desk workspace', () => {
  const position = new Vector3(15, 15, -5), motion = new PearMotion(position);
  const box = new Box3(new Vector3(12, 0, -8), new Vector3(18, 3, -2));
  settle(motion, [box]);
  assert.equal(position.y, 3);
  motion.pickUp();
  motion.moveTo(new Vector3(24, 2, 7.5), 0);
  motion.velocity.set(22, 0, 22);
  motion.drop(20);
  motion.update(30, []);
  assert.ok(position.x <= 24 && position.z <= 7.5);
  settle(motion);
  assert.ok(position.toArray().every(Number.isFinite));
});

test('a wide console uses its offset bounds for support and side contact without rotating', () => {
  const bounds = new Box3(new Vector3(-5, -.5, -2), new Vector3(5, 1, 2));
  const workspace = new Box3(new Vector3(-15, .5, -9), new Vector3(15, 25, 7));
  const position = new Vector3(0, 10, 0), motion = new DeskMotion(position, { bounds, workspace });
  const prop = new Box3(new Vector3(4, 0, -1), new Vector3(8, 3, 1));
  settle(motion, [prop]);
  assert.equal(position.y, 3.5);
  motion.reset(new Vector3(-2, .5, 0));
  motion.pickUp();
  motion.moveTo(new Vector3(-1.1, .5, 0), 0);
  motion.velocity.set(22, 0, 0);
  motion.drop(20);
  motion.update(.05, [prop]);
  assert.ok(position.x + bounds.max.x <= prop.min.x);
  assert.ok(motion.velocity.x <= 0);
  motion.pickUp();
  motion.moveTo(new Vector3(15, 25, 7), 100);
  motion.velocity.set(22, 22, 22);
  motion.drop(110);
  motion.update(.05, []);
  assert.ok(workspace.containsPoint(position));
});
