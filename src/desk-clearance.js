import { Vector3 } from 'three';

export function nearestDeskPosition(bounds, position, workspace, obstacles, gap = .25) {
  if (position.y < workspace.min.y || position.y > workspace.max.y) return null;
  const blocked = obstacles
    .filter(box => position.y + bounds.max.y > box.min.y && position.y + bounds.min.y < box.max.y)
    .map(box => ({
      minX: box.min.x - bounds.max.x - gap, maxX: box.max.x - bounds.min.x + gap,
      minZ: box.min.z - bounds.max.z - gap, maxZ: box.max.z - bounds.min.z + gap,
    }));
  const clamp = (value, axis) => Math.max(workspace.min[axis], Math.min(workspace.max[axis], value));
  const xs = new Set([clamp(position.x, 'x')]), zs = new Set([clamp(position.z, 'z')]);
  // The closest free point lies at the desired coordinate or a forbidden rectangle's edge.
  for (const box of blocked) {
    xs.add(clamp(box.minX, 'x')); xs.add(clamp(box.maxX, 'x'));
    zs.add(clamp(box.minZ, 'z')); zs.add(clamp(box.maxZ, 'z'));
  }
  let nearest = null, distance = Infinity;
  for (const x of xs) for (const z of zs) {
    const squared = (x - position.x) ** 2 + (z - position.z) ** 2;
    // World-to-local rounding must not swap otherwise equidistant sides.
    if (squared >= distance - 1e-9 || blocked.some(box =>
      x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ)) continue;
    nearest = new Vector3(x, position.y, z);
    distance = squared;
  }
  return nearest;
}
