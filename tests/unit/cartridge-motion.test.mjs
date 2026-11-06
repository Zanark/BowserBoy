import test from 'node:test';
import assert from 'node:assert/strict';
import { cartridgeFramingDuration, cartridgeSlideDuration, nextCartridgeElapsed } from '../../src/cartridge-motion.js';

test('sparse paints present lowered framing and seating without discarding elapsed time', () => {
  const motion = { elapsed: 0, lastPaint: null };
  const presented = [];
  for (const time of [0, 2800, 5600]) {
    motion.elapsed = nextCartridgeElapsed(motion, time, true);
    motion.lastPaint = time;
    presented.push(motion.elapsed);
  }
  assert.deepEqual(presented, [16.67, cartridgeFramingDuration, cartridgeFramingDuration + cartridgeSlideDuration]);
});

test('unpainted callbacks cannot advance the committed cartridge timeline', () => {
  const motion = { elapsed: 400, lastPaint: 1000 };
  assert.equal(nextCartridgeElapsed(motion, 9000, false), 400);
  assert.deepEqual(motion, { elapsed: 400, lastPaint: 1000 });
  assert.equal(nextCartridgeElapsed(motion, 900, true), 400);
});

test('ordinary paint intervals retain the framing and slide durations', () => {
  const motion = { elapsed: 0, lastPaint: 0 };
  for (let time = 10; time <= 2200; time += 10) {
    motion.elapsed = nextCartridgeElapsed(motion, time, true);
    motion.lastPaint = time;
    assert.equal(motion.elapsed, time);
  }
});
