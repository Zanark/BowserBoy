import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeFrame } from '../browser/pixel-lab.mjs';

const fixture = () => {
  const frames = new Map(), lookups = [];
  const page = {
    locator(selector) {
      lookups.push(selector);
      return { elementHandle: async () => ({ contentFrame: async () => frames.get(selector) }) };
    },
  };
  return { page, frames, lookups };
};
const liveFrame = () => ({ detached: false, isDetached() { return this.detached; } });

test('pixel probes reuse live runtimes without mixing consoles or pages', async () => {
  const first = fixture(), second = fixture();
  const gba = liveFrame(), ds = liveFrame(), other = liveFrame();
  first.frames.set('#runtime-mount iframe', gba);
  first.frames.set('#ds-runtime-mount iframe', ds);
  second.frames.set('#runtime-mount iframe', other);
  assert.equal(await runtimeFrame(first.page), gba);
  assert.equal(await runtimeFrame(first.page), gba);
  assert.equal(await runtimeFrame(first.page, '#ds-runtime-mount'), ds);
  assert.equal(await runtimeFrame(first.page, '#ds-runtime-mount'), ds);
  assert.equal(await runtimeFrame(second.page), other);
  assert.deepEqual(first.lookups, ['#runtime-mount iframe', '#ds-runtime-mount iframe']);
  assert.deepEqual(second.lookups, ['#runtime-mount iframe']);
});

test('pixel probes resolve the replacement runtime after a power cycle', async () => {
  const { page, frames, lookups } = fixture();
  const original = liveFrame(), replacement = liveFrame();
  frames.set('#ds-runtime-mount iframe', original);
  assert.equal(await runtimeFrame(page, '#ds-runtime-mount'), original);
  original.detached = true;
  frames.set('#ds-runtime-mount iframe', replacement);
  assert.equal(await runtimeFrame(page, '#ds-runtime-mount'), replacement);
  assert.equal(await runtimeFrame(page, '#ds-runtime-mount'), replacement);
  assert.equal(lookups.length, 2);
});
