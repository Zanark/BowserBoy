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

function buttonCap(radius) {
  const geometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -.045), new THREE.Vector2(radius * .87, -.045),
    new THREE.Vector2(radius, -.025), new THREE.Vector2(radius, .005),
    new THREE.Vector2(radius * .91, .035), new THREE.Vector2(radius * .6, .052),
    new THREE.Vector2(0, .055),
  ], 40);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function engravedLabel(parent, text, x, y, width, height, color, angle = -.18) {
  const group = new THREE.Group();
  group.position.set(x, y, .625);
  group.rotation.z = angle;
  const shape = roundedShape(width, height, height / 2);
  shape.holes.push(roundedShape(width - .018, height - .018, height / 2 - .009));
  const outline = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
  outline.receiveShadow = true;
  group.add(outline);
  label(group, text, width * .73, height * .48, -.04, 0, .002, color, 'italic bold 75px Arial');
  parent.add(group);
}

function makerMark(parent, material) {
  const glyphs = {
    Z: [[0, 1], [1, 1], [1, .82], [.28, .18], [1, .18], [1, 0], [0, 0], [0, .18], [.72, .82], [0, .82]],
    A: [[0, 0], [.35, 1], [.65, 1], [1, 0], [.78, 0], [.68, .3], [.32, .3], [.22, 0]],
    N: [[0, 0], [0, 1], [.22, 1], [.78, .32], [.78, 1], [1, 1], [1, 0], [.78, 0], [.22, .68], [.22, 0]],
    R: [[0, 0], [0, 1], [.74, 1], [1, .78], [1, .54], [.76, .35], [1, 0], [.73, 0], [.5, .32], [.22, .32], [.22, 0]],
    K: [[0, 0], [0, 1], [.22, 1], [.22, .57], [.72, 1], [1, 1], [.55, .48], [1, 0], [.7, 0], [.34, .34], [.22, .22], [.22, 0]],
  };
  const holes = {
    A: [[.4, .5], [.6, .5], [.5, .8]],
    R: [[.22, .55], [.65, .55], [.78, .65], [.78, .72], [.65, .8], [.22, .8]],
  };
  const shapes = [...'ZANARK'].map((letter, index) => {
    const points = polygon => polygon.map(([x, y]) =>
      new THREE.Vector2((index - 2.5) * .22 + (x - .5) * .17, (y - .5) * .24));
    const shape = new THREE.Shape(points(glyphs[letter]));
    if (holes[letter]) shape.holes.push(new THREE.Path(points(holes[letter])));
    return shape;
  });
  const badge = new THREE.Group();
  badge.name = 'Zanark embossed maker mark';
  badge.position.set(0, 2.10, .625);
  add(badge, 'Raised Zanark lettering', solid(shapes, .018, .003), material, 0, 0, .012);
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
  const logo = label(root, 'BOWSERBOY ADVANCE', 2.65, .17, 0, -1.34, .763,
    '#e2e2e2', 'italic 900 78px Arial');
  logo.name = 'Monochrome bezel wordmark';

  const controls = new Map();
  function control(id, mesh, width, height, anchor = mesh) {
    controls.set(id, { mesh, anchor, width, height, rest: mesh.position.z });
    mesh.userData.motion ??= {
      restPosition: mesh.position.clone(), restQuaternion: mesh.quaternion.clone(),
      travel: new THREE.Vector3(0, ['l', 'r'].includes(id) ? -.075 : 0,
        ['l', 'r'].includes(id) ? 0 : ['up', 'down', 'left', 'right'].includes(id) ? -.01 : ['start', 'select'].includes(id) ? -.025 : -.045),
      press: 0, pitch: 0, yaw: 0,
    };
  }
  const padFloor = add(root, 'D-pad socket', new THREE.ShapeGeometry(new THREE.Shape(padOpening.getPoints())), dark, 0, 0, .582);
  padFloor.castShadow = false;
  const padFace = cross.clone();
  const well = new THREE.Path();
  well.absarc(0, 0, .135, 0, Math.PI * 2, true);
  padFace.holes.push(well);
  const pad = add(root, 'D-pad', solid(padFace, .07, .015), silver, -3.2, .26, .655);
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
    const arrow = new THREE.Mesh(new THREE.ShapeGeometry(triangle), new THREE.MeshStandardMaterial({ color: '#a5ad9b', roughness: .65 }));
    arrow.position.copy(anchor.position);
    arrow.rotation.z = rotation;
    arrow.receiveShadow = true;
    pad.add(arrow);
  }
  add(pad, 'D-pad pivot well', new THREE.CircleGeometry(.135, 32), silver, 0, 0, .03);
  for (const { id, x, y, opening, radius, z, size } of roundControls) {
    const action = id === 'a' || id === 'b';
    const name = action ? id.toUpperCase() : id;
    const floor = add(root, `${name} socket`, new THREE.CircleGeometry(opening, 40), dark, x, y, .582);
    floor.castShadow = false;
    const button = add(root, `${name} button`, buttonCap(radius), silver, x, y, z);
    if (action) label(button, id.toUpperCase(), .25, .28, 0, -.005, .067, '#a2aa99', 'bold 95px Arial');
    else engravedLabel(root, id.toUpperCase(), x - .43, y + .04, 1.02, .32, '#766c9f');
    control(id, button, size, size);
  }
  for (const [id, x] of [['l', -3.45], ['r', 3.45]]) {
    const button = add(root, `${id.toUpperCase()} shoulder`, box(1.3, .39, .7, .12), silver, x, 1.81, .15);
    button.rotation.z = id === 'l' ? .16 : -.16;
    label(button, id.toUpperCase(), .22, .13, 0, .17, .39, '#8e9687');
    const anchor = new THREE.Object3D();
    anchor.position.set(0, .22, .39);
    button.add(anchor);
    control(id, button, 1.3, .27, anchor);
  }
  const led = add(root, 'Power light', cylinder(.09, .04),
    new THREE.MeshStandardMaterial({ color: '#495537', emissive: '#000000', roughness: .25 }), 2.85, 1.43, .64);
  label(root, 'POWER', .62, .11, 3.38, 1.43, .625, '#a99bc4', 'bold 70px Arial');
  for (const slot of speakerSlots) {
    const floor = add(root, 'Recessed speaker grille',
      new THREE.ShapeGeometry(roundedShape(slot.width, slot.height, .03)), dark, slot.x, slot.y, .581);
    floor.rotation.z = slot.angle;
    floor.castShadow = false;
  }
  label(root, 'BBA-001', .6, .09, -3.02, -1.95, .63, '#81739e');
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
  const backLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.05, .35),
    new THREE.MeshBasicMaterial({ map: wordmark, transparent: true, depthWrite: false, toneMapped: false }));
  backLabel.name = 'Orbital battery-cover logo';
  backLabel.scale.setScalar(2);
  backLabel.position.set(0, -.55, -.645);
  backLabel.rotation.y = Math.PI;
  root.add(backLabel);
  for (const [x, y] of [[-3.62, .92], [3.62, .92], [-3.16, -1.68], [3.16, -1.68], [0, 1.83]]) {
    add(root, 'Recessed screw socket', cylinder(.11, .03), dark, x, y, -.53);
    add(root, 'Screw', cylinder(.065, .035), silver, x, y, -.55);
    add(root, 'Screw slot', new THREE.BoxGeometry(.078, .015, .005), dark, x, y, -.572);
  }
  return { root, screen, recess, controls, led, cartridge };
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
