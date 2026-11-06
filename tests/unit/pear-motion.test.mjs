import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { PearMotion } from '../../src/pear-motion.js';

function settle(motion, obstacles = []) {
  for (let i = 0; i < 1800 && !motion.sleeping; i++) motion.update(1 / 120, obstacles);
  assert.equal(motion.sleeping, true);
}

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
