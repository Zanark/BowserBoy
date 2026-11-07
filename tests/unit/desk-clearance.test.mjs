import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { nearestDeskPosition } from '../../src/desk-clearance.js';

const box = (min, max) => new Box3(new Vector3(...min), new Vector3(...max));
const bounds = () => box([-.5, 0, -.5], [.5, 1, .5]);
const workspace = () => box([-2, 0, -2], [2, 20, 2]);

test('the nearest legal placement combines boundaries of multiple obstacles', () => {
  const obstacles = [
    box([-2.25, 6, -4.25], [.25, 9, 4.25]),
    box([-4.25, 6, -2.25], [4.25, 9, .75]),
  ];
  const position = new Vector3(0, 7, 0);
  const result = nearestDeskPosition(bounds(), position, workspace(), obstacles);
  assert.ok(result instanceof Vector3);
  assert.ok(result.distanceTo(new Vector3(1, 7, 1.5)) < 1e-8);
  assert.ok(Math.abs(result.distanceTo(position) - Math.hypot(1, 1.5)) < 1e-8);
  assert.ok(result.equals(nearestDeskPosition(bounds(), position, workspace(), [...obstacles].reverse())));
});

test('a completely occupied root workspace has no legal placement', () => {
  assert.equal(nearestDeskPosition(bounds(), new Vector3(0, 1, 0), workspace(),
    [box([-5, 0, -5], [5, 4, 5])]), null);
});

test('placement preserves all inputs and returns an independent vector', () => {
  const envelope = bounds(), position = new Vector3(0, 3, 0), allowed = workspace();
  const obstacles = [box([-.5, 2, -.5], [.5, 5, .5])];
  const originals = [envelope.clone(), position.clone(), allowed.clone(), obstacles[0].clone()];
  const result = nearestDeskPosition(envelope, position, allowed, obstacles);
  assert.ok(result instanceof Vector3);
  assert.notStrictEqual(result, position);
  assert.equal(result.y, 3);
  assert.ok(envelope.equals(originals[0]));
  assert.ok(position.equals(originals[1]));
  assert.ok(allowed.equals(originals[2]));
  assert.ok(obstacles[0].equals(originals[3]));
  result.set(100, 100, 100);
  assert.ok(position.equals(originals[1]));
});

test('vertically disjoint obstacles do not displace a legal XZ position', () => {
  const position = new Vector3(.3, 7, -.2);
  const result = nearestDeskPosition(bounds(), position, workspace(), [
    box([-10, 0, -10], [10, 6.99, 10]),
    box([-10, 8.01, -10], [10, 12, 10]),
  ]);
  assert.ok(result.equals(position));
});

test('offset current-orientation bounds and root workspace limits determine the nearest side', () => {
  const envelope = box([-2, 0, -.25], [1, 1, .25]);
  const allowed = box([-1, 0, -4], [4, 10, 4]);
  const result = nearestDeskPosition(envelope, new Vector3(0, 0, .1), allowed,
    [box([0, 0, -1], [2, 2, 1])]);
  assert.ok(result.distanceTo(new Vector3(0, 0, 1.5)) < 1e-8);
  assert.ok(allowed.containsPoint(result));
});

test('an unobstructed out-of-workspace request clamps only XZ and honors an explicit gap', () => {
  const result = nearestDeskPosition(bounds(), new Vector3(5, 3, -5), workspace(), []);
  assert.deepEqual(result.toArray(), [2, 3, -2]);
  const obstacle = box([-1, 0, -4], [1, 2, 4]);
  const desired = new Vector3(0, 0, 0);
  const tight = nearestDeskPosition(bounds(), desired, workspace(), [obstacle], 0);
  const spaced = nearestDeskPosition(bounds(), desired, workspace(), [obstacle], .4);
  assert.ok(Math.abs(Math.abs(tight.x) - 1.5) < 1e-8);
  assert.ok(Math.abs(Math.abs(spaced.x) - 1.9) < 1e-8);
  assert.equal(tight.z, 0);
  assert.equal(spaced.z, 0);
  assert.ok(spaced.equals(nearestDeskPosition(bounds(), desired, workspace(), [obstacle], .4)));
});

test('rebuilding moved world bounds does not flip a prop between equidistant clearance edges', () => {
  // This cartridge-sized envelope reproduces rounding from the real desk geometry.
  const envelope = box(
    [-.952300188529811, -.14499999582767503, -.8638677273565221],
    [.9523001885298106, .21000000000000008, .8638677273565218]);
  const anchor = new Vector3(4.3, .18, -1.9);
  const allowed = box([-21, .18, -10.6], [23, .18, 8.6]);
  const obstacles = [box([-.2, -1.5, -6.4], [8.8, 8.2, 2.6])];
  const first = nearestDeskPosition(envelope, anchor, allowed, obstacles);
  assert.ok(first instanceof Vector3);
  const reconstructed = envelope.clone().translate(first).translate(first.clone().negate());
  const second = nearestDeskPosition(reconstructed, anchor, allowed, obstacles);
  assert.ok(second instanceof Vector3);
  assert.ok(second.equals(first), `A world/local roundtrip moved the prop ${first.distanceTo(second)} units`);
});

test('a legal edge survives a one-ULP bounds roundtrip without accepting genuine overlap', () => {
  const envelope = box([-.3, 0, -.5], [.5, 1, .5]);
  const allowed = box([0, 0, -2], [2, 20, 2]);
  const obstacle = box([-10, 2, -10], [.4, 5, 10]);
  const first = nearestDeskPosition(envelope, new Vector3(0, 3, .2), allowed, [obstacle]);
  assert.ok(first instanceof Vector3);
  assert.deepEqual(first.toArray(), [.95, 3, .2]);

  // Translating to the returned edge and back changes min X by one representable value.
  const reconstructed = envelope.clone().translate(first).translate(first.clone().negate());
  const originals = [reconstructed.clone(), first.clone(), allowed.clone(), obstacle.clone()];
  const reused = nearestDeskPosition(reconstructed, first, allowed, [obstacle]);
  assert.ok(reused instanceof Vector3);
  assert.notStrictEqual(reused, first);
  assert.deepEqual(reused.toArray(), first.toArray());
  assert.ok(!reconstructed.clone().translate(reused).intersectsBox(obstacle));

  const overlapping = first.clone().add(new Vector3(-.01, 0, 0));
  const requested = overlapping.clone();
  const cleared = nearestDeskPosition(reconstructed, overlapping, allowed, [obstacle]);
  assert.ok(cleared instanceof Vector3);
  assert.ok(cleared.x > overlapping.x);
  assert.equal(cleared.y, overlapping.y);
  assert.equal(cleared.z, overlapping.z);
  assert.ok(allowed.containsPoint(cleared));
  assert.ok(reconstructed.clone().translate(cleared).min.x >= obstacle.max.x + .25);
  assert.ok(overlapping.equals(requested));
  assert.ok(reconstructed.equals(originals[0]));
  assert.ok(first.equals(originals[1]));
  assert.ok(allowed.equals(originals[2]));
  assert.ok(obstacle.equals(originals[3]));
});
