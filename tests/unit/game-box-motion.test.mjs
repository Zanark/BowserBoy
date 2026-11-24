import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGameBoxElapsed } from '../../src/game-box-motion.js';

test('sparse shelf paints catch up while presenting every unpacking stage', () => {
  const motion = { elapsed: 0, lastPaint: null };
  const presented = [];
  for (let time = 0; time <= 21000; time += 3000) {
    motion.elapsed = nextGameBoxElapsed(motion, time);
    motion.lastPaint = time;
    presented.push(motion.elapsed);
  }
  assert.deepEqual(presented, [0, 650, 1350, 2300, 3050, 4150, 4250, 4900]);
});

test('shelf preparation does not commit time and reduced motion finishes immediately', () => {
  const motion = { elapsed: 650, lastPaint: 1000 };
  assert.equal(nextGameBoxElapsed(motion, 900), 650);
  assert.equal(nextGameBoxElapsed(motion, 9000), 1350);
  assert.deepEqual(motion, { elapsed: 650, lastPaint: 1000 });
  assert.equal(nextGameBoxElapsed(motion, 1000, true), 4900);
});

test('ordinary shelf paints retain the authored animation duration', () => {
  const motion = { elapsed: 0, lastPaint: 0 };
  for (let time = 10; time <= 4900; time += 10) {
    motion.elapsed = nextGameBoxElapsed(motion, time);
    motion.lastPaint = time;
    assert.equal(motion.elapsed, time);
  }
});
