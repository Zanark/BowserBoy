import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DsTouchQueue } from '../../src/ds-touch.js';

function fixture() {
  const samples = [], frames = [], errors = [];
  const queue = new DsTouchQueue({
    dispatch: sample => samples.push(sample),
    nextFrame: () => new Promise(resolve => frames.push(resolve)),
    onError: error => errors.push(error),
  });
  const advance = async () => { frames.shift()(); await Promise.resolve(); };
  return { queue, samples, errors, advance };
}

test('quick contacts retain separate down/up frames and original coordinates', async () => {
  const { queue, samples, advance } = fixture();
  for (const x of [32, 72, 112]) {
    queue.push({ x, y: 80, pressed: true });
    queue.push({ x, y: 80, pressed: false });
  }
  assert.deepEqual(samples, [{ x: 32, y: 80, pressed: true }]);
  for (let index = 0; index < 5; index++) await advance();
  assert.deepEqual(samples, [32, 72, 112].flatMap(x => [
    { x, y: 80, pressed: true }, { x, y: 80, pressed: false },
  ]));
});

test('drag moves coalesce without losing contact start, endpoint or subsequent taps', async () => {
  const { queue, samples, advance } = fixture();
  queue.push({ x: 20, y: 80, pressed: true });
  for (let x = 21; x <= 100; x++) queue.push({ x, y: 80, pressed: true });
  queue.push({ x: 100, y: 80, pressed: false });
  queue.push({ x: 150, y: 120, pressed: true });
  queue.push({ x: 160, y: 120, pressed: true });
  queue.push({ x: 160, y: 120, pressed: false });
  for (let index = 0; index < 5; index++) await advance();
  assert.deepEqual(samples, [
    { x: 20, y: 80, pressed: true }, { x: 100, y: 80, pressed: true },
    { x: 100, y: 80, pressed: false }, { x: 150, y: 120, pressed: true },
    { x: 160, y: 120, pressed: true }, { x: 160, y: 120, pressed: false },
  ]);
});

test('cancellation immediately releases and discards stale contacts, including after host pointer-up', async () => {
  const { queue, samples, advance } = fixture();
  queue.push({ x: 20, y: 80, pressed: true });
  queue.push({ x: 20, y: 80, pressed: false });
  queue.push({ x: 100, y: 120, pressed: true });
  queue.push({ x: 100, y: 120, pressed: false });
  queue.cancel();
  assert.deepEqual(samples, [{ x: 20, y: 80, pressed: true }, { x: 20, y: 80, pressed: false }]);
  queue.push({ x: 200, y: 150, pressed: true });
  await advance();
  assert.deepEqual(samples.at(-1), { x: 200, y: 150, pressed: true });
  queue.cancel();
  await advance();
  assert.equal(samples.length, 4);
  assert.deepEqual(samples.at(-1), { x: 200, y: 150, pressed: false });
});

test('asynchronous delivery errors are surfaced and remaining samples discarded', async () => {
  const { queue, errors, advance } = fixture();
  queue.push({ x: 20, y: 80, pressed: true });
  queue.push({ x: 100, y: 120, pressed: true });
  queue.push({ x: 100, y: 120, pressed: false });
  const error = new Error('Native input failed');
  queue.dispatch = () => { throw error; };
  await advance();
  assert.deepEqual(errors, [error]);
  assert.equal(queue.samples.length, 0);
});
