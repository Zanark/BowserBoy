import { Vector3 } from 'three';

const step = 1 / 120;
const radius = 3;
const height = 8.1;

export class PearMotion {
  constructor(position) {
    this.position = position;
    this.velocity = new Vector3();
    this.previous = new Vector3();
    this.reset(position);
  }

  reset(position) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.accumulator = 0;
    this.held = false;
    this.sleeping = position.y === 0;
    this.lastMove = -Infinity;
  }

  pickUp() {
    this.held = true;
    this.sleeping = false;
    this.velocity.set(0, 0, 0);
    this.lastMove = -Infinity;
    this.accumulator = 0;
  }

  moveTo(position, time) {
    const seconds = Math.max(.008, Math.min(.1, (time - this.lastMove) / 1000));
    if (Number.isFinite(this.lastMove)) {
      this.velocity.subVectors(position, this.position).divideScalar(seconds).clampLength(0, 22);
    }
    this.position.copy(position);
    this.lastMove = time;
  }

  drop(time) {
    if (time - this.lastMove > 100) this.velocity.set(0, 0, 0);
    this.held = false;
    this.sleeping = false;
    this.accumulator = 0;
  }

  update(seconds, obstacles) {
    if (this.held || this.sleeping) return false;
    this.accumulator += Math.max(0, Math.min(seconds, .05));
    let changed = false;
    while (this.accumulator + 1e-10 >= step) {
      this.accumulator = Math.max(0, this.accumulator - step);
      this.previous.copy(this.position);
      this.velocity.y -= 45 * step;
      this.velocity.x *= .998;
      this.velocity.z *= .998;
      this.position.addScaledVector(this.velocity, step);
      let supported = false;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = Math.abs(this.velocity.y) > 1.2 ? Math.abs(this.velocity.y) * .23 : 0;
        supported = true;
      }
      for (const axis of ['x', 'z']) {
        const low = axis === 'x' ? -22 : -11.5, high = axis === 'x' ? 24 : 7.5;
        if (this.position[axis] < low || this.position[axis] > high) {
          this.position[axis] = Math.max(low, Math.min(high, this.position[axis]));
          this.velocity[axis] *= -.23;
        }
      }
      for (const box of obstacles) {
        const minX = box.min.x - radius, maxX = box.max.x + radius;
        const minZ = box.min.z - radius, maxZ = box.max.z + radius;
        const p = this.position, before = this.previous;
        if (p.x <= minX || p.x >= maxX || p.z <= minZ || p.z >= maxZ ||
            p.y >= box.max.y || p.y + height <= box.min.y) continue;
        if (before.y >= box.max.y) {
          p.y = box.max.y;
          this.velocity.y = Math.abs(this.velocity.y) > 1.2 ? Math.abs(this.velocity.y) * .23 : 0;
          supported = true;
        } else if (before.y + height <= box.min.y) {
          p.y = box.min.y - height;
          this.velocity.y = -Math.abs(this.velocity.y) * .23;
        } else {
          const sides = [
            ['x', minX, Math.abs(p.x - minX)], ['x', maxX, Math.abs(p.x - maxX)],
            ['z', minZ, Math.abs(p.z - minZ)], ['z', maxZ, Math.abs(p.z - maxZ)],
          ];
          sides.sort((a, b) => a[2] - b[2]);
          const [axis, edge] = sides[0];
          p[axis] = edge;
          this.velocity[axis] *= -.23;
        }
      }
      if (supported) {
        this.velocity.x *= .85;
        this.velocity.z *= .85;
        if (this.velocity.lengthSq() < .0025) {
          this.velocity.set(0, 0, 0);
          this.sleeping = true;
          this.accumulator = 0;
        }
      }
      changed = true;
      if (this.sleeping) break;
    }
    return changed;
  }
}
