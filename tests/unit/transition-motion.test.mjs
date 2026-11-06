import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTransitionElapsed } from '../../src/transition-motion.js';

test('sparse paints retain the initial pose and lifted midpoint before completing a transition', () => {
  const transition = { elapsed: 0, lastPaint: null, duration: 850 };
  const presented = [];
  for (const time of [100, 2900, 5700]) {
    transition.elapsed = nextTransitionElapsed(transition, time, true);
    transition.lastPaint = time;
    presented.push(transition.elapsed);
  }
  assert.deepEqual(presented, [0, 425, 850]);
});

test('unpainted callbacks and backwards timestamps cannot advance the committed transition', () => {
  const transition = { elapsed: 200, lastPaint: 1000, duration: 850 };
  assert.equal(nextTransitionElapsed(transition, 9000, false), 200);
  assert.equal(nextTransitionElapsed(transition, 900, true), 200);
  assert.deepEqual(transition, { elapsed: 200, lastPaint: 1000, duration: 850 });
});

test('ordinary paint intervals preserve transition duration and reduced motion completes immediately', () => {
  const transition = { elapsed: 0, lastPaint: 0, duration: 850 };
  for (let time = 25; time <= 850; time += 25) {
    transition.elapsed = nextTransitionElapsed(transition, time, true);
    transition.lastPaint = time;
    assert.equal(transition.elapsed, time);
  }
  assert.equal(nextTransitionElapsed({ elapsed: 0, lastPaint: null, duration: 0 }, 100, true), 0);
});
