import { Vector3 } from 'three';

const step = 1 / 120;
const tableFront = 10, tableBottom = -2.4;

export class PearRope {
  constructor(points, { radiusAt, radius = .085, tipRadius = .32, tipFloor = tipRadius }) {
    this.rest = points.map(point => point.clone());
    this.positions = points.map(point => point.clone());
    this.previous = points.map(point => point.clone());
    this.lengths = points.slice(1).map((point, index) => point.distanceTo(points[index]));
    this.length = this.lengths.reduce((sum, length) => sum + length, 0);
    this.radiusAt = radiusAt;
    this.radius = radius;
    this.tipRadius = tipRadius;
    this.tipFloor = tipFloor;
    this.origin = new Vector3();
    this.shift = new Vector3();
    this.difference = new Vector3();
    this.reset(this.origin);
  }

  reset(origin) {
    this.origin.copy(origin);
    this.positions.forEach((point, index) => {
      point.copy(this.rest[index]).add(origin);
      this.previous[index].copy(point);
    });
    this.accumulator = 0;
    this.quietFrames = 0;
    this.sleeping = true;
  }

  settle(origin) {
    this.reset(origin);
    this.sleeping = false;
    for (let i = 0; i < 600 && !this.sleeping; i++) this.integrate();
    this.previous.forEach((point, index) => point.copy(this.positions[index]));
    this.accumulator = 0;
    this.sleeping = true;
  }

  get tipSupported() {
    const tip = this.positions.at(-1);
    return Math.abs(tip.y - this.tipFloor) < .01 && tip.z <= tableFront;
  }

  update(origin, seconds) {
    this.shift.subVectors(origin, this.origin);
    const distance = this.shift.length();
    const moved = distance > 1e-8;
    if (moved) {
      this.sleeping = false;
      this.quietFrames = 0;
      // Limit inertial lag on a pointer teleport, without creating extra velocity.
      if (distance > this.length * 2) {
        this.shift.multiplyScalar(1 - this.length * 2 / distance);
        for (let i = 1; i < this.positions.length; i++) {
          this.positions[i].add(this.shift);
          this.previous[i].add(this.shift);
        }
      }
      this.origin.copy(origin);
      this.positions[0].copy(this.rest[0]).add(origin);
    }
    if (this.sleeping) return false;
    this.accumulator += Math.max(0, Math.min(seconds, .05));
    let updated = moved;
    let stepped = false;
    while (this.accumulator + 1e-10 >= step) {
      this.accumulator = Math.max(0, this.accumulator - step);
      this.integrate();
      stepped = true;
      updated = true;
      if (this.sleeping) break;
    }
    if (moved && !stepped) this.constrain();
    return updated;
  }

  integrate() {
    const last = this.positions.length - 1;
    for (let i = 1; i <= last; i++) {
      const position = this.positions[i], previous = this.previous[i];
      this.difference.subVectors(position, previous).multiplyScalar(.985);
      previous.copy(position);
      position.add(this.difference);
      position.y -= 45 * step * step;
    }
    this.constrain();
    const quiet = this.positions.every((point, index) => !index || point.distanceToSquared(this.previous[index]) < 2e-6);
    this.quietFrames = quiet ? this.quietFrames + 1 : 0;
    if (this.quietFrames >= 24) {
      this.sleeping = true;
      this.accumulator = 0;
      this.previous.forEach((point, index) => point.copy(this.positions[index]));
    }
  }

  constrain() {
    const last = this.positions.length - 1;
    for (let iteration = 0; iteration < 120; iteration++) {
      for (let i = 0; i < last; i++) {
        const a = this.positions[i], b = this.positions[i + 1];
        this.difference.subVectors(b, a);
        const length = this.difference.length();
        if (length < 1e-10) continue;
        const aWeight = i === 0 ? 0 : 1, bWeight = i + 1 === last ? .3 : 1;
        this.difference.multiplyScalar((length - this.lengths[i]) / length / (aWeight + bWeight));
        a.addScaledVector(this.difference, aWeight);
        b.addScaledVector(this.difference, -bWeight);
      }
      for (let i = 1; i <= last; i++) {
        const p = this.positions[i], previous = this.previous[i];
        const floor = i === last ? this.tipFloor : this.radius;
        const radius = i === last ? this.tipRadius : this.radius;
        const edge = tableFront + radius;
        if (p.y < floor && p.y > tableBottom - floor && p.z < edge) {
          if (p.z > tableFront && p.y > 0) {
            const distance = Math.hypot((p.z - tableFront) / radius, p.y / floor);
            if (distance < 1) {
              p.z = tableFront + (p.z - tableFront) / distance;
              p.y /= distance;
            }
          } else if (p.y <= 0 && edge - p.z < floor - p.y) {
            p.z = edge;
            previous.z = edge;
          } else {
            p.y = floor;
            previous.y = floor;
            previous.x = p.x - (p.x - previous.x) * .75;
            previous.z = p.z - (p.z - previous.z) * .75;
          }
        }
        if (p.y < -35 + floor) {
          p.y = -35 + floor;
          previous.y = p.y;
        }
        const x = p.x - this.origin.x, z = p.z - this.origin.z;
        const radial = Math.hypot(x, z), body = this.radiusAt(p.y - this.origin.y);
        const clearance = body + (i === last ? this.tipRadius : this.radius);
        if (body > 0 && radial < clearance && radial > 1e-8) {
          p.x = this.origin.x + x * clearance / radial;
          p.z = this.origin.z + z * clearance / radial;
        }
      }
      if (this.positions.slice(1).every((point, index) =>
        Math.abs(point.distanceTo(this.positions[index]) - this.lengths[index]) < .002)) break;
    }
  }
}
