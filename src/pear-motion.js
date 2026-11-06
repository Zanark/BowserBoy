import { Box3, Vector3 } from 'three';

const step = 1 / 120;

export class DeskMotion {
  constructor(position, { bounds, workspace }) {
    this.position = position;
    this.bounds = bounds;
    this.workspace = workspace;
    this.velocity = new Vector3();
    this.previous = new Vector3();
    this.reset(position);
  }

  reset(position) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.accumulator = 0;
    this.held = false;
    this.sleeping = position.y === this.workspace.min.y;
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
    this.accumulator += Math.max(0, Math.min(seconds, .5));
    let changed = false;
    while (this.accumulator + 1e-10 >= step) {
      this.accumulator = Math.max(0, this.accumulator - step);
      this.previous.copy(this.position);
      this.velocity.y -= 45 * step;
      this.velocity.x *= .998;
      this.velocity.z *= .998;
      this.position.addScaledVector(this.velocity, step);
      let supported = false;
      if (this.position.y <= this.workspace.min.y) {
        this.position.y = this.workspace.min.y;
        this.velocity.y = Math.abs(this.velocity.y) > 1.2 ? Math.abs(this.velocity.y) * .23 : 0;
        supported = true;
      }
      for (const axis of ['x', 'z']) {
        const low = this.workspace.min[axis], high = this.workspace.max[axis];
        if (this.position[axis] < low || this.position[axis] > high) {
          this.position[axis] = Math.max(low, Math.min(high, this.position[axis]));
          this.velocity[axis] *= -.23;
        }
      }
      if (this.position.y > this.workspace.max.y) {
        this.position.y = this.workspace.max.y;
        this.velocity.y = -Math.abs(this.velocity.y) * .23;
      }
      for (const box of obstacles) {
        const minX = box.min.x - this.bounds.max.x, maxX = box.max.x - this.bounds.min.x;
        const minZ = box.min.z - this.bounds.max.z, maxZ = box.max.z - this.bounds.min.z;
        const p = this.position, before = this.previous;
        if (p.x <= minX || p.x >= maxX || p.z <= minZ || p.z >= maxZ ||
            p.y + this.bounds.min.y >= box.max.y || p.y + this.bounds.max.y <= box.min.y) continue;
        if (before.y + this.bounds.min.y >= box.max.y) {
          p.y = box.max.y - this.bounds.min.y;
          this.velocity.y = Math.abs(this.velocity.y) > 1.2 ? Math.abs(this.velocity.y) * .23 : 0;
          supported = true;
        } else if (before.y + this.bounds.max.y <= box.min.y) {
          p.y = box.min.y - this.bounds.max.y;
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

export class PearMotion extends DeskMotion {
  constructor(position) {
    super(position, {
      bounds: new Box3(new Vector3(-3, 0, -3), new Vector3(3, 8.1, 3)),
      workspace: new Box3(new Vector3(-22, 0, -11.5), new Vector3(24, 25, 7.5)),
    });
  }
}
