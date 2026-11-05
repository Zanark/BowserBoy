import * as THREE from 'three';
import { brandImage } from './brand.js';

function roundedShape(width, height, radius) {
  const x = -width / 2, y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function solid(shape, depth, bevel = .035) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel > 0, bevelSize: bevel,
    bevelThickness: bevel, bevelSegments: 3, curveSegments: 18,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function box(width, height, depth, radius = .08) {
  return solid(roundedShape(width, height, radius), depth);
}

function crtShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-.451 * width, -.483 * height);
  shape.quadraticCurveTo(0, -.521 * height, .451 * width, -.483 * height);
  shape.quadraticCurveTo(.478 * width, -.482 * height, .480 * width, -.44 * height);
  shape.quadraticCurveTo(.503 * width, 0, .480 * width, .44 * height);
  shape.quadraticCurveTo(.478 * width, .482 * height, .451 * width, .483 * height);
  shape.quadraticCurveTo(0, .521 * height, -.451 * width, .483 * height);
  shape.quadraticCurveTo(-.478 * width, .482 * height, -.480 * width, .44 * height);
  shape.quadraticCurveTo(-.503 * width, 0, -.480 * width, -.44 * height);
  shape.quadraticCurveTo(-.478 * width, -.482 * height, -.451 * width, -.483 * height);
  shape.closePath();
  return shape;
}

export function createLcdGeometries(curved) {
  const width = 4.05, height = width * 2 / 3;
  const screen = curved ? new THREE.ShapeGeometry(crtShape(width, height), 32) :
    new THREE.PlaneGeometry(width, height);
  // Fit the pinned CRT edge without warping its already-filtered framebuffer again.
  if (curved) {
    const position = screen.getAttribute('position'), uv = screen.getAttribute('uv');
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) / width + .5, position.getY(i) / height + .5);
    }
  }
  screen.userData.viewport = { width, height };
  return {
    screen,
    recess: solid(curved ? crtShape(width + .12, height + .12) :
      roundedShape(width + .12, height + .12, .025), .015, .009),
  };
}

export function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas drawing is unavailable. The 3D display could not be created.');
  paint(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function textTexture(text, color = '#bfc3ad', font = 'bold 75px Arial', aspect = 8) {
  return canvasTexture(Math.ceil(128 * aspect), 128, (context, width, height) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, width / 2, height / 2, width - 18);
  });
}

function label(parent, text, width, height, x, y, z, color, font) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: textTexture(text, color, font, width / height), transparent: true, depthWrite: false, roughness: .65 }));
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function add(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(radius, depth) {
  const geometry = new THREE.CylinderGeometry(radius, radius, depth, 32);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function buttonCap(radius, recessed = false) {
  const geometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -.045), new THREE.Vector2(radius * .87, -.045),
    new THREE.Vector2(radius, -.025), new THREE.Vector2(radius, .005),
    new THREE.Vector2(radius * .91, .035), new THREE.Vector2(radius * .6, .052),
    new THREE.Vector2(0, .055),
  ], 40);
  geometry.rotateX(Math.PI / 2);
  if (recessed) {
    // Keep the original rim normals; remove only triangles closing the center dome.
    const position = geometry.getAttribute('position'), index = geometry.getIndex();
    const triangles = [];
    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      if (triangle.some(vertex => Math.hypot(position.getX(vertex), position.getY(vertex)) < .00001 &&
        position.getZ(vertex) > .05)) continue;
      triangles.push(...triangle);
    }
    geometry.setIndex(triangles);
  }
  return geometry;
}

const moldedGlyphs = {
  A: [[0, 0], [.35, 1], [.65, 1], [1, 0], [.78, 0], [.68, .3], [.32, .3], [.22, 0]],
  B: [[0, 0], [0, 1], [.7, 1], [.94, .82], [.94, .62], [.78, .51], [1, .36], [1, .18], [.74, 0]],
  C: [[1, .82], [.76, 1], [.24, 1], [0, .76], [0, .24], [.24, 0], [.76, 0], [1, .18], [.85, .35], [.66, .22], [.34, .22], [.22, .34], [.22, .66], [.34, .78], [.66, .78], [.85, .65]],
  E: [[0, 0], [0, 1], [1, 1], [1, .78], [.22, .78], [.22, .61], [.82, .61], [.82, .39], [.22, .39], [.22, .22], [1, .22], [1, 0]],
  L: [[0, 0], [0, 1], [.22, 1], [.22, .22], [1, .22], [1, 0]],
  N: [[0, 0], [0, 1], [.22, 1], [.78, .32], [.78, 1], [1, 1], [1, 0], [.78, 0], [.22, .68], [.22, 0]],
  R: [[0, 0], [0, 1], [.74, 1], [1, .78], [1, .54], [.76, .35], [1, 0], [.73, 0], [.5, .32], [.22, .32], [.22, 0]],
  S: [[1, .82], [.76, 1], [.2, 1], [0, .8], [0, .57], [.2, .4], [.72, .4], [.78, .34], [.78, .27], [.71, .2], [.28, .2], [.13, .32], [0, .15], [.2, 0], [.8, 0], [1, .2], [1, .43], [.8, .6], [.28, .6], [.22, .66], [.22, .73], [.29, .8], [.68, .8], [.85, .68]],
  T: [[0, .78], [0, 1], [1, 1], [1, .78], [.61, .78], [.61, 0], [.39, 0], [.39, .78]],
  Z: [[0, 1], [1, 1], [1, .82], [.28, .18], [1, .18], [1, 0], [0, 0], [0, .18], [.72, .82], [0, .82]],
  K: [[0, 0], [0, 1], [.22, 1], [.22, .57], [.72, 1], [1, 1], [.55, .48], [1, 0], [.7, 0], [.34, .34], [.22, .22], [.22, 0]],
};
const moldedCounters = {
  A: [[[.4, .5], [.6, .5], [.5, .8]]],
  B: [[[.22, .6], [.64, .6], [.72, .66], [.72, .73], [.63, .8], [.22, .8]],
    [[.22, .2], [.66, .2], [.78, .28], [.78, .32], [.66, .4], [.22, .4]]],
  R: [[[.22, .55], [.65, .55], [.78, .65], [.78, .72], [.65, .8], [.22, .8]]],
};

function moldedShapes(text, width, height) {
  const scale = width / (1 + (text.length - 1) * 1.3);
  return [...text].map((letter, index) => {
    const points = polygon => polygon.map(([px, py]) => new THREE.Vector2(
      ((index - (text.length - 1) / 2) * 1.3 + px - .5) * scale, (py - .5) * height));
    const shape = new THREE.Shape(points(moldedGlyphs[letter]));
    for (const hole of moldedCounters[letter] ?? []) shape.holes.push(new THREE.Path(points(hole)));
    return shape;
  });
}

function moldedText(parent, text, width, height, depth, material, x = 0, y = 0, z = 0) {
  return add(parent, `Raised ${text} lettering`, solid(moldedShapes(text, width, height), depth, .0025), material, x, y, z);
}

function alphaContours(pixels, width, height, project, threshold = 128) {
  const vertices = new Map();
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const edgeCorners = [[0, 1], [1, 2], [3, 2], [0, 3]];
  const join = (a, b) => {
    vertices.get(a).neighbors.push(b);
    vertices.get(b).neighbors.push(a);
  };
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const alpha = corners.map(([dx, dy]) => pixels[((y + dy) * width + x + dx) * 4 + 3]);
      if (alpha.every(value => value < threshold) || alpha.every(value => value >= threshold)) continue;
      const keys = [(y * width + x) * 2, (y * width + x + 1) * 2 + 1,
        ((y + 1) * width + x) * 2, (y * width + x) * 2 + 1];
      const crossings = [];
      for (let edge = 0; edge < 4; edge++) {
        const [a, b] = edgeCorners[edge];
        if ((alpha[a] >= threshold) === (alpha[b] >= threshold)) continue;
        const key = keys[edge];
        if (!vertices.has(key)) {
          const t = (threshold - .5 - alpha[a]) / (alpha[b] - alpha[a]);
          const px = x + .5 + corners[a][0] + (corners[b][0] - corners[a][0]) * t;
          const py = y + .5 + corners[a][1] + (corners[b][1] - corners[a][1]) * t;
          vertices.set(key, { point: project(px, py), neighbors: [] });
        }
        crossings.push(key);
      }
      if (crossings.length === 2) join(...crossings);
      else if (alpha[0] >= threshold) {
        join(crossings[0], crossings[3]);
        join(crossings[1], crossings[2]);
      } else {
        join(crossings[0], crossings[1]);
        join(crossings[2], crossings[3]);
      }
    }
  }
  const contours = [], visited = new Set();
  for (const start of vertices.keys()) {
    if (visited.has(start)) continue;
    const contour = [];
    let current = start, previous;
    do {
      const vertex = vertices.get(current);
      if (visited.has(current) || vertex.neighbors.length !== 2) {
        throw new Error('The engraved artwork has an invalid alpha contour.');
      }
      visited.add(current);
      contour.push(vertex.point);
      const next = vertex.neighbors.find(key => key !== previous);
      previous = current;
      current = next;
    } while (current !== start);
    contours.push(contour);
  }
  return contours;
}

function actionButtonGlyph(text) {
  if (text !== 'A' && text !== 'B') throw new Error(`Unsupported action-button glyph: ${text}`);
  // Recover the original antialiased Arial contours, size and baseline as real cutouts.
  const texture = textTexture(text, '#fff', 'bold 95px Arial', .25 / .28);
  const { width, height } = texture.image;
  const pixels = texture.image.getContext('2d').getImageData(0, 0, width, height).data;
  texture.dispose();
  const contours = alphaContours(pixels, width, height, (px, py) =>
    new THREE.Vector2((px / width - .5) * .25, (.5 - py / height) * .28 - .005));
  if (contours.length !== (text === 'A' ? 2 : 3)) {
    throw new Error(`The original ${text} lettering could not be recovered with its counters.`);
  }
  contours.sort((a, b) => Math.abs(THREE.ShapeUtils.area(b)) - Math.abs(THREE.ShapeUtils.area(a)));
  const glyph = new THREE.Shape(contours[0]);
  glyph.closePath();
  for (const contour of contours.slice(1)) {
    const counter = new THREE.Path(contour);
    counter.closePath();
    glyph.holes.push(counter);
  }
  return glyph;
}

function engraveRearLogo(cover, texture) {
  const width = 2.95, height = width * texture.image.height / texture.image.width;
  const depth = .006, centerY = -.35;
  const mask = canvasTexture(512, 171, (context, w, h) => context.drawImage(texture.image, 0, 0, w, h));
  const pixels = mask.image.getContext('2d').getImageData(0, 0, 512, 171).data;
  const contours = alphaContours(pixels, 512, 171, (px, py) =>
    new THREE.Vector2((px / 512 - .5) * width, (.5 - py / 171) * height + centerY), 16);
  mask.dispose();
  if (!contours.length) throw new Error('The supplied rear logo has no engravable artwork.');
  const contains = (points, point) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a.y > point.y) !== (b.y > point.y) &&
        point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  };
  contours.sort((a, b) => Math.abs(THREE.ShapeUtils.area(b)) - Math.abs(THREE.ShapeUtils.area(a)));
  const regions = [], face = roundedShape(3.65, 2.9, .2);
  for (const points of contours) {
    const parent = regions.findLast(region => region.bounds.containsPoint(points[0]) && contains(region.points, points[0]));
    const level = parent ? parent.level + 1 : 0;
    if (THREE.ShapeUtils.isClockWise(points) !== (level % 2 === 0)) points.reverse();
    const shape = new THREE.Shape(points), path = new THREE.Path(points);
    shape.closePath();
    path.closePath();
    (parent ? parent.shape : face).holes.push(path);
    regions.push({ points, shape, level, bounds: new THREE.Box2().setFromPoints(points) });
  }
  cover.geometry.computeBoundingBox();
  const surfaceZ = cover.geometry.boundingBox.min.z;
  const position = cover.geometry.getAttribute('position'), triangles = [];
  for (let i = 0; i < position.count; i += 3) {
    if ([0, 1, 2].every(j => Math.abs(position.getZ(i + j) - surfaceZ) < 1e-6)) continue;
    triangles.push(i, i + 1, i + 2);
  }
  // Replace only the rear cap; keep the original bevel, thickness and side normals.
  cover.geometry.setIndex(triangles);
  const engraving = new THREE.Group();
  engraving.name = 'Colored rear-logo engraving';
  engraving.position.z = surfaceZ;
  engraving.rotation.y = Math.PI;
  cover.add(engraving);
  add(engraving, 'Engraved battery-cover face',
    new THREE.ShapeGeometry([face, ...regions.filter(region => region.level % 2).map(region => region.shape)], 18),
    cover.material);
  const floor = new THREE.ShapeGeometry(regions.filter(region => region.level % 2 === 0).map(region => region.shape));
  const floorPosition = floor.getAttribute('position'), uv = floor.getAttribute('uv');
  for (let i = 0; i < floorPosition.count; i++) {
    uv.setXY(i, floorPosition.getX(i) / width + .5, (floorPosition.getY(i) - centerY) / height + .5);
  }
  const logo = add(engraving, 'Orbital battery-cover logo', floor,
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }), 0, 0, -depth);
  logo.castShadow = logo.receiveShadow = false;
  const walls = [];
  for (const { points } of regions) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      walls.push(a.x, a.y, 0, a.x, a.y, -depth, b.x, b.y, 0,
        b.x, b.y, 0, a.x, a.y, -depth, b.x, b.y, -depth);
    }
  }
  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(walls, 3));
  wallGeometry.computeVertexNormals();
  add(engraving, 'Rear logo groove walls', wallGeometry, cover.material);
}

function recessedLetter(button, text, radius, material) {
  const glyph = actionButtonGlyph(text);
  const floorZ = .047;
  const face = new THREE.Shape();
  face.absarc(0, 0, radius * .6, 0, Math.PI * 2, false);
  face.holes.push(new THREE.Path(glyph.getPoints()));
  const top = new THREE.ShapeGeometry([
    face, ...glyph.holes.map(hole => new THREE.Shape(hole.getPoints())),
  ], 20);
  // Continue the original cap dome around the cutout and its solid counter islands.
  const surface = (x, y) => .055 - .003 * Math.hypot(x, y) / (radius * .6);
  const position = top.getAttribute('position'), normal = top.getAttribute('normal');
  const rimNormal = new THREE.Vector2(.02, radius * .91).normalize();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    position.setZ(i, surface(x, y));
    normal.setXYZ(i, rimNormal.x * x / (radius * .6), rimNormal.x * y / (radius * .6), rimNormal.y);
  }
  add(button, `${text} recessed cap face`, top, button.material);
  const floor = new THREE.ShapeGeometry(glyph);
  floor.translate(0, 0, floorZ);
  add(button, `Recessed ${text} lettering`, floor, material);

  const vertices = [];
  for (const contour of [glyph.getPoints(), ...glyph.holes.map(hole => hole.getPoints())]) {
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i], b = contour[(i + 1) % contour.length];
      vertices.push(
        a.x, a.y, surface(a.x, a.y), a.x, a.y, floorZ, b.x, b.y, surface(b.x, b.y),
        b.x, b.y, surface(b.x, b.y), a.x, a.y, floorZ, b.x, b.y, floorZ);
    }
  }
  const walls = new THREE.BufferGeometry();
  walls.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  walls.computeVertexNormals();
  add(button, `${text} groove walls`, walls, material);
}

function moldedLabel(parent, text, x, y, width, height, material, angle = -.18) {
  const group = new THREE.Group();
  group.name = `${text} molded shell label`;
  group.position.set(x, y, .625);
  group.rotation.z = angle;
  const shape = roundedShape(width, height, height / 2);
  shape.holes.push(roundedShape(width - .018, height - .018, height / 2 - .009));
  add(group, `${text} molded outline`, solid(shape, .008, .002), material, 0, 0, .002);
  moldedText(group, text, width * .64, height * .43, .014, material, -.07, 0, .004);
  parent.add(group);
}

function makerMark(parent, material) {
  const badge = new THREE.Group();
  badge.name = 'Zanark embossed maker mark';
  badge.position.set(0, 2.10, .625);
  const letters = moldedText(badge, 'ZANARK', 1.27, .24, .018, material, 0, 0, .012);
  letters.name = 'Raised Zanark lettering';
  const chamfer = (width, height) => [
    [-width / 2 + .09, height / 2], [width / 2 - .09, height / 2],
    [width / 2, height / 2 - .07], [width / 2, -height / 2 + .07],
    [width / 2 - .09, -height / 2], [-width / 2 + .09, -height / 2],
    [-width / 2, -height / 2 + .07], [-width / 2, height / 2 - .07],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const frame = new THREE.Shape(chamfer(1.58, .38));
  frame.holes.push(new THREE.Path(chamfer(1.55, .35)));
  add(badge, 'Chamfered maker frame', solid(frame, .010, .002), material, 0, 0, .006);
  parent.add(badge);
}

export function createHandheld() {
  const root = new THREE.Group();
  root.name = 'Indigo handheld';
  const purple = new THREE.MeshStandardMaterial({ color: '#454184', roughness: .53, metalness: .035 });
  const rear = new THREE.MeshStandardMaterial({ color: '#3e396e', roughness: .63 });
  const seam = new THREE.MeshStandardMaterial({ color: '#29253e', roughness: .85 });
  const bezel = new THREE.MeshStandardMaterial({ color: '#202a29', roughness: .32 });
  const silver = new THREE.MeshPhysicalMaterial({ color: '#d8d9cb', roughness: .36, metalness: 0, clearcoat: .22, clearcoatRoughness: .4 });
  const rubber = silver.clone();
  rubber.roughness = .68;
  rubber.clearcoat = .06;
  const buttonMark = rubber.clone();
  buttonMark.color.set('#999d98');
  buttonMark.roughness = .85;
  buttonMark.clearcoat = 0;
  const padMark = rubber.clone();
  padMark.color.set('#a5ad9b');
  const dark = new THREE.MeshStandardMaterial({ color: '#242332', roughness: .85 });
  const shell = new THREE.Shape();
  shell.moveTo(-4.1, 1.45);
  shell.quadraticCurveTo(-4.07, 1.73, -3.78, 1.8);
  shell.lineTo(-3.13, 1.94);
  shell.quadraticCurveTo(-2.9, 1.98, -2.76, 2.07);
  shell.lineTo(-2.24, 2.38);
  shell.quadraticCurveTo(-2.18, 2.42, -2.08, 2.42);
  shell.lineTo(2.08, 2.42);
  shell.quadraticCurveTo(2.18, 2.42, 2.24, 2.38);
  shell.lineTo(2.76, 2.07);
  shell.quadraticCurveTo(2.9, 1.98, 3.13, 1.94);
  shell.lineTo(3.78, 1.8);
  shell.quadraticCurveTo(4.07, 1.73, 4.1, 1.45);
  shell.quadraticCurveTo(4.28, .15, 4.25, -1.04);
  shell.quadraticCurveTo(4.25, -1.55, 3.66, -1.72);
  shell.lineTo(2.12, -2.17);
  shell.quadraticCurveTo(0, -2.61, -2.12, -2.17);
  shell.lineTo(-3.66, -1.72);
  shell.quadraticCurveTo(-4.25, -1.55, -4.25, -1.04);
  shell.quadraticCurveTo(-4.28, .15, -4.1, 1.45);
  shell.closePath();
  const speakerSlots = Array.from({ length: 6 }, (_, index) => ({
    x: 3.02, y: -.79 - index * .16, width: 1.02, height: .065, angle: .23,
  }));
  const cross = new THREE.Shape();
  for (const [index, [x, y]] of [
    [-.205, .61], [.205, .61], [.205, .205], [.61, .205], [.61, -.205], [.205, -.205],
    [.205, -.61], [-.205, -.61], [-.205, -.205], [-.61, -.205], [-.61, .205], [-.205, .205],
  ].entries()) {
    if (index === 0) cross.moveTo(x, y); else cross.lineTo(x, y);
  }
  cross.closePath();
  const padOpening = new THREE.Path(cross.getPoints().map(point =>
    point.multiplyScalar(1.09).add(new THREE.Vector2(-3.2, .26))));
  const roundControls = [
    { id: 'a', x: 3.55, y: .50, opening: .315, radius: .29, z: .653, size: .65 },
    { id: 'b', x: 2.76, y: -.02, opening: .315, radius: .29, z: .653, size: .65 },
    { id: 'start', x: -2.64, y: -.98, opening: .18, radius: .155, z: .65, size: .38 },
    { id: 'select', x: -2.70, y: -1.5, opening: .18, radius: .155, z: .65, size: .38 },
  ];
  const face = shell.clone();
  face.holes.push(padOpening);
  for (const { x, y, opening } of roundControls) {
    const hole = new THREE.Path();
    hole.absarc(x, y, opening, 0, Math.PI * 2, true);
    face.holes.push(hole);
  }
  for (const slot of speakerSlots) {
    const points = roundedShape(slot.width, slot.height, .03).getPoints(10).map((point) =>
      point.rotateAround(new THREE.Vector2(), slot.angle).add(new THREE.Vector2(slot.x, slot.y)));
    face.holes.push(new THREE.Path(points));
  }
  add(root, 'Shell seam', solid(shell, .08, .08), seam, 0, 0, .05);
  add(root, 'Rear shell', solid(shell, .36, .1), rear, 0, 0, -.26);
  add(root, 'Front shell', solid(shell, .36, .1), purple, 0, 0, .3);
  add(root, 'Front face with speaker apertures', solid(face, .04, .008), purple, 0, 0, .592);
  makerMark(root, purple);
  add(root, 'Bezel surround', box(4.47, 3.39, .045, .3), seam, 0, .1, .65);
  add(root, 'Charcoal bezel', box(4.35, 3.27, .055, .27), bezel, 0, .1, .685);
  const lcd = createLcdGeometries(true);
  const recess = add(root, 'LCD recess', lcd.recess, dark, 0, .22, .748);
  const screen = add(root, 'Live LCD', lcd.screen,
    new THREE.MeshBasicMaterial({ color: 'white', toneMapped: false }), 0, .22, .782);
  screen.castShadow = false;
  screen.receiveShadow = false;
  const wordmark = canvasTexture(1024, 342, (context, width, height) => {
    context.drawImage(brandImage, 0, 0, width, height);
  });
  const bezelWordmark = canvasTexture(1536, 174, (context, width, height) => {
    context.drawImage(brandImage, 25, 250, 2115, 240, width * .2, height * .2, width * .6, height * .6);
    const pixels = context.getImageData(0, 0, width, height);
    // Keep neutral lettering/highlights; discard the saturated orbital accents.
    for (let i = 0; i < pixels.data.length; i += 4) {
      const neutral = Math.min(...pixels.data.subarray(i, i + 3));
      pixels.data[i + 3] *= THREE.MathUtils.clamp((neutral - 95) / 70, 0, 1);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 220;
    }
    // Reconstruct original letter pixels from solid cores, excluding thin detached
    // contours. The core filter selects components; it does not erode their edges.
    const lettering = new Uint8Array(width * height);
    const frontier = [];
    for (let y = 3; y < height - 3; y++) {
      for (let x = 3; x < width - 3; x++) {
        const index = y * width + x;
        if (pixels.data[index * 4 + 3] <= 200) continue;
        let solid = true;
        for (let dy = -3; solid && dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (pixels.data[((y + dy) * width + x + dx) * 4 + 3] <= 200) {
              solid = false;
              break;
            }
          }
        }
        if (solid) {
          lettering[index] = 1;
          frontier.push(index);
        }
      }
    }
    if (!frontier.length) throw new Error('The supplied wordmark has no solid lettering.');
    for (let cursor = 0; cursor < frontier.length; cursor++) {
      const index = frontier[cursor], x = index % width, y = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (!lettering[next] && pixels.data[next * 4 + 3]) {
            lettering[next] = 1;
            frontier.push(next);
          }
        }
      }
    }
    for (let i = 0; i < lettering.length; i++) {
      if (!lettering[i]) pixels.data[i * 4 + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
    const chrome = context.createLinearGradient(0, height * .2, 0, height * .8);
    for (const [stop, color] of [
      [0, '#f4f8ff'], [.2, '#91cce9'], [.37, '#e9c8f5'], [.44, '#fbffff'],
      [.49, '#697796'], [.55, '#849bbf'], [.72, '#d7f0e2'], [.86, '#d6a5cb'], [1, '#f4f7ff'],
    ]) chrome.addColorStop(stop, color);
    // Clip the reflected chrome bands and iridescent tint to the existing letter alpha.
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = chrome;
    context.fillRect(0, 0, width, height);
    const tint = context.createLinearGradient(width * .2, 0, width * .8, 0);
    tint.addColorStop(0, 'rgba(91,220,255,.18)');
    tint.addColorStop(.35, 'rgba(211,153,255,.18)');
    tint.addColorStop(.7, 'rgba(255,215,164,.16)');
    tint.addColorStop(1, 'rgba(130,236,215,.18)');
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = tint;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  });
  const logo = add(root, 'Metallic chroma bezel wordmark', new THREE.PlaneGeometry(3.05, .346),
    new THREE.MeshStandardMaterial({ map: bezelWordmark, transparent: true, depthWrite: false, roughness: .4, metalness: .1 }),
    0, -1.34, .763);
  logo.castShadow = false;

  const controls = new Map();
  function control(id, mesh, width, height, anchor = mesh) {
    controls.set(id, { mesh, anchor, width, height, rest: mesh.position.z });
    mesh.userData.motion ??= {
      restPosition: mesh.position.clone(), restQuaternion: mesh.quaternion.clone(),
      travel: new THREE.Vector3(0, ['l', 'r'].includes(id) ? -.12 : 0,
        ['l', 'r'].includes(id) ? 0 : ['up', 'down', 'left', 'right'].includes(id) ? -.016 : ['start', 'select'].includes(id) ? -.04 : -.075),
      press: 0, pitch: 0, yaw: 0,
    };
  }
  const padFloor = add(root, 'D-pad socket', new THREE.ShapeGeometry(new THREE.Shape(padOpening.getPoints())), dark, 0, 0, .582);
  padFloor.castShadow = false;
  const padFace = cross.clone();
  const well = new THREE.Path();
  well.absarc(0, 0, .135, 0, Math.PI * 2, true);
  padFace.holes.push(well);
  const pad = add(root, 'D-pad', solid(padFace, .07, .015), rubber, -3.2, .26, .655);
  for (const [id, x, y, rotation] of [
    ['up', 0, .40, 0], ['down', 0, -.40, Math.PI],
    ['left', -.40, 0, Math.PI / 2], ['right', .40, 0, -Math.PI / 2],
  ]) {
    const anchor = new THREE.Object3D();
    anchor.position.set(x, y, .055);
    pad.add(anchor);
    control(id, pad, .39, .39, anchor);
    const triangle = new THREE.Shape();
    triangle.moveTo(0, .055); triangle.lineTo(-.055, -.04); triangle.lineTo(.055, -.04); triangle.closePath();
    const arrow = add(pad, `Raised ${id} arrow`, solid(triangle, .008, .002), padMark, x, y, .055);
    arrow.rotation.z = rotation;
  }
  add(pad, 'D-pad pivot well', new THREE.CircleGeometry(.135, 32), silver, 0, 0, .03);
  for (const { id, x, y, opening, radius, z, size } of roundControls) {
    const action = id === 'a' || id === 'b';
    const name = action ? id.toUpperCase() : id;
    const floor = add(root, `${name} socket`, new THREE.CircleGeometry(opening, 40), dark, x, y, .582);
    floor.castShadow = false;
    const button = add(root, `${name} button`, buttonCap(radius, action), rubber, x, y, z);
    if (action) recessedLetter(button, name, radius, buttonMark);
    else moldedLabel(root, id.toUpperCase(), x - .43, y + .04, 1.02, .32, purple);
    control(id, button, size, size);
  }
  for (const [id, x] of [['l', -3.45], ['r', 3.45]]) {
    const button = add(root, `${id.toUpperCase()} shoulder`, box(1.3, .39, .7, .12), silver, x, 1.81, .15);
    button.rotation.z = id === 'l' ? .16 : -.16;
    moldedText(button, id.toUpperCase(), .095, .10, .01, silver, 0, .17, .39);
    const anchor = new THREE.Object3D();
    anchor.position.set(0, .22, .39);
    button.add(anchor);
    control(id, button, 1.3, .27, anchor);
  }
  const led = add(root, 'Power light', cylinder(.09, .04),
    new THREE.MeshStandardMaterial({ color: '#495537', emissive: '#000000', roughness: .25 }), 2.85, 1.43, .64);
  for (const slot of speakerSlots) {
    const floor = add(root, 'Recessed speaker grille',
      new THREE.ShapeGeometry(roundedShape(slot.width, slot.height, .03)), dark, slot.x, slot.y, .581);
    floor.rotation.z = slot.angle;
    floor.castShadow = false;
  }
  const powerMount = new THREE.Group();
  powerMount.name = 'Underside power assembly';
  powerMount.position.set(1.55, -2.385, .12);
  // Face out of the curved lower edge; local X follows the shell's tangent.
  powerMount.rotation.set(Math.PI / 2, .15, 0);
  root.add(powerMount);
  add(powerMount, 'Power slider track', solid(roundedShape(1.02, .24, .055), .025, .008), dark);
  const power = add(powerMount, 'Power switch', solid(roundedShape(.74, .16, .035), .16, .01), dark, .1, 0, .06);
  control('power', power, 1.08, .42);
  for (let i = 0; i < 5; i++) add(power, 'Switch grip', new THREE.BoxGeometry(.045, .085, .012), silver, -.24 + i * .12, 0, .094);
  label(powerMount, 'POWER', .48, .075, 0, -.22, .018, '#c3b9ab', 'bold 70px Arial');
  const slot = add(root, 'Cartridge slot', box(3.05, .15, .42, .04), dark, 0, 2.28, -.12);
  slot.userData.tools = true;
  const cartridge = createCartridge('#666574', 'BBA', 'LOCAL CARTRIDGE');
  cartridge.name = 'Loaded cartridge';
  cartridge.scale.set(1.9, 1.9, 1);
  cartridge.position.set(0, 1.52, -.3);
  cartridge.visible = false;
  cartridge.traverse(object => { object.userData.tools = true; });
  root.add(cartridge);
  add(root, 'Link port', new THREE.BoxGeometry(.8, .12, .14), dark, 0, 2.38, .33);
  const headphone = add(root, 'Headphone socket', cylinder(.12, .08), dark, -1.6, -2.21, -.12);
  headphone.rotation.x = Math.PI / 2;
  const cover = add(root, 'Battery cover', box(3.65, 2.9, .06, .2), rear, 0, -.2, -.57);
  for (let i = 0; i < 4; i++) add(cover, 'Battery thumb grip', box(.58, .035, .025, .01), purple, 0, .85 - i * .12, -.065);
  engraveRearLogo(cover, wordmark);
  for (const [x, y] of [[-3.62, .92], [3.62, .92], [-3.16, -1.68], [3.16, -1.68], [0, 1.83]]) {
    add(root, 'Recessed screw socket', cylinder(.11, .03), dark, x, y, -.53);
    add(root, 'Screw', cylinder(.065, .035), silver, x, y, -.55);
    add(root, 'Screw slot', new THREE.BoxGeometry(.078, .015, .005), dark, x, y, -.572);
  }
  return { root, screen, recess, controls, led, cartridge, wordmark: bezelWordmark };
}

export function createCartridge(color, title, subtitle) {
  const root = new THREE.Group();
  const plastic = new THREE.MeshStandardMaterial({ color, roughness: .72 });
  add(root, 'Original cartridge prop', box(1.48, 1.13, .22, .1), plastic);
  add(root, 'Cartridge label', box(1.17, .65, .025, .04),
    new THREE.MeshStandardMaterial({ color: '#e2dac0', roughness: .85 }), 0, -.02, .15);
  label(root, title, 1.05, .18, 0, .11, .21, '#43494b', 'italic bold 75px Arial');
  label(root, subtitle, 1.05, .10, 0, -.12, .21, '#5e6250', 'bold 60px Arial');
  for (let i = 0; i < 5; i++) add(root, 'Cartridge grip', new THREE.BoxGeometry(.07, .16, .025), plastic, -.53 + i * .26, -.43, .14);
  return root;
}

export function createWood() {
  const texture = canvasTexture(1024, 1024, (context, width, height) => {
    let seed = 41;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    context.fillStyle = '#b88b60';
    context.fillRect(0, 0, width, height);
    for (let plank = 0; plank < 8; plank++) {
      const top = plank * 128;
      context.fillStyle = `rgba(${random() > .5 ? '255,224,171' : '90,51,24'},${.025 + random() * .07})`;
      context.fillRect(0, top, width, 128);
      for (let line = 0; line < 110; line++) {
        const y = top + random() * 128;
        context.beginPath();
        context.moveTo(0, y);
        for (let x = 0; x <= width; x += 16) context.lineTo(x, y + Math.sin(x * .007 + plank * 4 + line) * (1 + line % 5));
        context.strokeStyle = `rgba(74,38,12,${.015 + random() * .06})`;
        context.lineWidth = .4 + random() * .7;
        context.stroke();
      }
      context.fillStyle = '#6e4a344d';
      context.fillRect(0, top, width, 1.5);
      context.fillStyle = '#efd3a73b';
      context.fillRect(0, top + 2, width, 1);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}
