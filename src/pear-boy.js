import * as THREE from 'three';
import { canvasTexture } from './handheld.js';
import { PearRope } from './pear-rope.js';

export function createPearBoy() {
  const root = new THREE.Group();
  root.name = 'pear-boy - movable warm silicone lamp';
  const diffusion = canvasTexture(16, 256, (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#b8b8b8');
    gradient.addColorStop(.65, '#ffffff');
    gradient.addColorStop(1, '#d6d6d6');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
  const silicone = new THREE.MeshStandardMaterial({
    color: '#fff3d4', roughness: .65, emissive: '#ffe4a0', emissiveMap: diffusion, emissiveIntensity: 77,
  });
  const gold = new THREE.MeshStandardMaterial({ color: '#e7aa3b', roughness: .6 });
  const brown = new THREE.MeshStandardMaterial({ color: '#55301d', roughness: .8 });
  const green = new THREE.MeshStandardMaterial({ color: '#52851d', roughness: .65 });
  const ink = new THREE.MeshBasicMaterial({ color: '#20140e' });
  const freckles = new THREE.MeshBasicMaterial({ color: '#d88724', toneMapped: false });
  const blush = new THREE.MeshBasicMaterial({ color: '#ff8fc3', toneMapped: false });
  const pink = new THREE.MeshBasicMaterial({ color: '#f16b85', toneMapped: false });
  const white = new THREE.MeshBasicMaterial({ color: '#f4f6f2', toneMapped: false });
  const braid = canvasTexture(64, 128, (context, width, height) => {
    context.fillStyle = '#b98b47';
    context.fillRect(0, 0, width, height);
    for (const direction of [-1, 1]) for (let y = -height; y < height * 2; y += 14) {
      context.strokeStyle = direction > 0 ? '#e5c27c' : '#98703a';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + direction * 32);
      context.stroke();
    }
  });
  braid.wrapS = braid.wrapT = THREE.RepeatWrapping;
  braid.repeat.set(1, 3);
  const cord = new THREE.MeshStandardMaterial({ color: '#ead8a8', map: braid, roughness: .95 });
  const limbs = [];
  const face = {
    root: new THREE.Group(), calm: new THREE.Group(), scared: new THREE.Group(),
    angry: new THREE.Group(), sad: new THREE.Group(), eyes: [],
    anchor: new THREE.Object3D(), gaze: new THREE.Vector2(), lifted: false, elapsed: 0,
    reacting: false, presented: false,
  };
  face.calm.name = 'pear-boy curious face';
  face.scared.name = 'pear-boy scared-of-heights face';
  face.scared.visible = false;
  face.angry.name = 'pear-boy angry landing face';
  face.sad.name = 'pear-boy pouting recovery face';
  face.root.name = 'pear-boy pointer-following face';
  face.root.add(face.calm, face.scared, face.angry, face.sad);
  root.add(face.root);
  function mesh(name, geometry, material, position = new THREE.Vector3()) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.copy(position);
    object.userData.pearBoy = true;
    object.receiveShadow = true;
    root.add(object);
    return object;
  }
  const curve = new THREE.CatmullRomCurve3([
    [0, .16], [1.6, .16], [2.5, .4], [2.85, 1.3], [2.8, 2.4],
    [2.5, 3.5], [1.95, 4.7], [1.6, 5.9], [1, 6.6], [0, 6.85],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const profile = curve.getPoints(96).map(point => new THREE.Vector2(Math.max(0, point.x), point.y));
  const body = mesh('pear-boy glowing pear silhouette', new THREE.LatheGeometry(profile, 64), silicone);
  function radiusAt(y) {
    if (y < .16 || y > 6.85) return 0;
    const index = profile.findIndex((point, index) => index > 8 && point.y >= y);
    if (index < 1) return 0;
    const a = profile[index - 1], b = profile[index];
    return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
  }
  function front(x, y, inset = .03) {
    const index = profile.findIndex((point, index) => index > 8 && point.y >= y);
    const a = profile[index - 1], b = profile[index];
    const radius = THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
    return new THREE.Vector3(x, y, Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) + inset);
  }
  function tube(name, points, radius, material) {
    return mesh(name, new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points), 24, radius, 8, false), material);
  }
  function facePatch(name, shape, material, inset = .06) {
    const shapeGeometry = new THREE.ShapeGeometry(shape, 16);
    const triangles = shapeGeometry.toNonIndexed();
    shapeGeometry.dispose();
    let points = Array.from({ length: triangles.attributes.position.count }, (_, index) =>
      new THREE.Vector3().fromBufferAttribute(triangles.attributes.position, index));
    triangles.dispose();
    // Broad filled expressions must follow the shell, not cut through its curved surface.
    for (let level = 0; level < 2; level++) {
      const subdivided = [];
      for (let i = 0; i < points.length; i += 3) {
        const [a, b, c] = points.slice(i, i + 3);
        const ab = a.clone().lerp(b, .5), bc = b.clone().lerp(c, .5), ca = c.clone().lerp(a, .5);
        subdivided.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      }
      points = subdivided;
    }
    return mesh(name, new THREE.BufferGeometry().setFromPoints(points.map(point => front(point.x, point.y, inset))), material);
  }
  face.anchor.position.copy(front(0, 4.5));
  root.add(face.anchor);
  function limb(name, points, tip, tipRadius, tipFloor = tipRadius) {
    const curve = new THREE.CatmullRomCurve3(points);
    const physics = new PearRope(curve.getSpacedPoints(6), { radiusAt, radius: .14, tipRadius, tipFloor });
    physics.sleeping = false;
    for (let i = 0; i < 600 && !physics.sleeping; i++) physics.update(root.position, 1 / 120);
    physics.rest = physics.positions.map(point => point.clone());
    physics.reset(root.position);
    curve.points = physics.rest.map(point => point.clone());
    const rope = mesh(name, new THREE.TubeGeometry(curve, 24, physics.radius, 6, false), cord);
    rope.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    rope.geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
    limbs.push({ physics, curve, rope, tip });
  }
  for (const side of [-1, 1]) {
    const eye = mesh('pear-boy black eye', new THREE.SphereGeometry(1, 16, 12), ink, front(side * .66, 4.5));
    eye.scale.set(.18, .22, .09);
    face.calm.add(eye);
    face.eyes.push({ mesh: eye, side });
    const squint = tube('pear-boy squeezed-shut eye', [
      front(side * .98, 4.84, .07),
      front(side * .56, 4.43, .07),
      front(side * 1.04, 4.43, .07),
    ], .07, ink);
    face.scared.add(squint);
    const cheek = new THREE.Shape();
    cheek.absellipse(side * 1.06, 4.1, .24, .17, 0, Math.PI * 2);
    face.scared.add(facePatch('pear-boy rosy scream cheek', cheek, blush, .025));
    const angryEye = new THREE.Shape();
    angryEye.absellipse(side * .76, 4.67, .27, .29, 0, Math.PI * 2);
    face.angry.add(facePatch('pear-boy angry eye outline', angryEye, ink));
    const angryWhite = new THREE.Shape();
    angryWhite.absellipse(side * .76, 4.67, .17, .19, 0, Math.PI * 2);
    face.angry.add(facePatch('pear-boy angry eye white', angryWhite, white, .085));
    face.angry.add(tube('pear-boy small furrowed eyebrow', [
      front(side * 1.02, 5.15, .07), front(side * .78, 5.13, .07), front(side * .49, 5.01, .07),
    ], .06, ink));
    for (const x of [.95, 1.13, 1.31]) {
      face.angry.add(tube('pear-boy angry blush stroke', [
        front(side * x, 3.84, .055), front(side * (x - .04), 3.63, .055),
      ], .035, pink));
    }
    face.sad.add(tube('pear-boy pouting squeezed eye', [
      front(side * 1.04, 4.94, .07), front(side * .62, 4.69, .07), front(side * 1.04, 4.44, .07),
    ], .065, ink));
    face.sad.add(tube('pear-boy tiny frustrated brow', [
      front(side * .5, 5.26, .07), front(side * .39, 5.16, .07), front(side * .28, 5.24, .07),
    ], .045, ink));
    const sadCheek = new THREE.Shape();
    sadCheek.absellipse(side * 1.08, 4.08, .28, .16, 0, Math.PI * 2, false, side * .15);
    face.sad.add(facePatch('pear-boy pouting rosy cheek', sadCheek, blush, .025));
    for (const [x, y] of [[1.05, 4.25], [1.16, 4.03], [.92, 4.04]]) {
      const dot = mesh('pear-boy cheek freckle', new THREE.SphereGeometry(.055, 10, 8), freckles, front(side * x, y));
      dot.scale.z = .4;
      face.root.add(dot);
    }
    const hand = mesh('pear-boy rounded hand', new THREE.SphereGeometry(1, 16, 12), gold,
      new THREE.Vector3(side * 3.05, 1.6, .8));
    hand.scale.set(.23, .32, .25);
    limb('pear-boy flexible rope arm', [
      new THREE.Vector3(side * 2.48, 3.45, .35),
      new THREE.Vector3(side * 2.91, 2.5, .65),
      hand.position.clone(),
    ], hand, .32);
    const foot = mesh('pear-boy rounded foot', new THREE.SphereGeometry(1, 20, 12), gold,
      new THREE.Vector3(side * 2.05, .36, 3.85));
    foot.scale.set(.42, .36, .55);
    limb('pear-boy flexible rope leg', [
      new THREE.Vector3(side * 1.2, .65, 2.35),
      new THREE.Vector3(side * 1.7, .4, 3.15),
      foot.position.clone(),
    ], foot, .55, .36);
  }
  const smile = tube('pear-boy smile', Array.from({ length: 17 }, (_, index) => {
    const t = index / 16;
    return front(-.5 + t, 3.96 - Math.sin(t * Math.PI) * .32, .04);
  }), .055, ink);
  face.calm.add(smile);
  face.mouth = tube('pear-boy frightened wobbly mouth', Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    return front(-.6 + t * 1.2, 3.6 + Math.cos(t * Math.PI * 6) * .075, .08);
  }), .065, ink);
  const openMouth = new THREE.Shape();
  openMouth.moveTo(-.64, 3.6);
  openMouth.bezierCurveTo(-.64, 3.9, -.35, 3.98, -.12, 3.83);
  openMouth.bezierCurveTo(-.05, 3.78, .05, 3.78, .12, 3.83);
  openMouth.bezierCurveTo(.35, 3.98, .64, 3.9, .64, 3.6);
  openMouth.bezierCurveTo(.64, 3.3, .35, 3.22, .12, 3.37);
  openMouth.bezierCurveTo(.05, 3.42, -.05, 3.42, -.12, 3.37);
  openMouth.bezierCurveTo(-.35, 3.22, -.64, 3.3, -.64, 3.6);
  face.openMouth = facePatch('pear-boy open scream mouth', openMouth, ink);
  face.scared.add(face.mouth, face.openMouth);
  const angryMouth = new THREE.Shape();
  angryMouth.moveTo(-.42, 3.92);
  angryMouth.quadraticCurveTo(0, 3.84, .42, 3.95);
  angryMouth.quadraticCurveTo(.5, 3.7, .43, 3.35);
  angryMouth.quadraticCurveTo(0, 3.25, -.43, 3.35);
  angryMouth.quadraticCurveTo(-.5, 3.7, -.42, 3.92);
  face.angry.add(facePatch('pear-boy angry shouting mouth', angryMouth, ink));
  const tongue = new THREE.Shape();
  tongue.moveTo(-.29, 3.48);
  tongue.lineTo(.29, 3.48);
  tongue.lineTo(.29, 3.66);
  tongue.quadraticCurveTo(0, 3.77, -.29, 3.66);
  tongue.closePath();
  face.angry.add(facePatch('pear-boy angry pink tongue', tongue, pink, .085));
  for (const points of [
    [[-1.28, 5.08], [-1.1, 5.26], [-1.16, 5.47]],
    [[-.96, 5.65], [-.91, 5.38], [-.68, 5.32]],
    [[-.65, 5.15], [-.91, 5.12], [-.99, 4.95]],
  ]) face.angry.add(tube('pear-boy anger mark', points.map(([x, y]) => front(x, y + .42, .07)), .055, ink));
  face.sad.add(tube('pear-boy small puckered pout', [
    front(.09, 3.93, .07), front(-.1, 3.78, .07), front(.07, 3.64, .07),
    front(-.1, 3.49, .07), front(.09, 3.34, .07),
  ], .055, ink));
  function showExpression(expression) {
    face.calm.visible = expression === 'curious';
    face.scared.visible = expression === 'scared';
    face.angry.visible = expression === 'angry';
    face.sad.visible = expression === 'sad';
    face.mouth.visible = true;
    face.openMouth.visible = false;
    face.elapsed = 0;
    face.presented = false;
    root.userData.expression = expression;
  }
  function setFaceLifted(lifted, { reset = false } = {}) {
    face.lifted = lifted;
    if (lifted || reset) face.reacting = false;
    if (!face.reacting) showExpression(lifted ? 'scared' : 'curious');
  }
  function reactToImpact(speed) {
    if (speed < 10 || face.reacting) return;
    face.reacting = true;
    showExpression('angry');
  }
  function acknowledgeFacePaint() {
    face.presented = true;
  }
  function updateFace(delta, target, reducedMotion) {
    const previousX = face.gaze.x, previousY = face.gaze.y;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-12 * delta);
    face.gaze.lerp(target, blend);
    if (face.gaze.distanceToSquared(target) < 1e-7) face.gaze.copy(target);
    let changed = face.gaze.x !== previousX || face.gaze.y !== previousY;
    if (changed) {
      face.root.position.y = face.gaze.y * .18;
      face.root.rotation.y = face.gaze.x * .55;
      const radius = radiusAt(4.5 + face.root.position.y) / radiusAt(4.5);
      face.root.scale.set(radius, 1, radius);
    }
    if (face.lifted || face.reacting) {
      face.elapsed += Math.max(0, delta);
      if (face.reacting) {
        const angry = root.userData.expression === 'angry';
        if (face.elapsed >= (angry ? .9 : 1.25) && face.presented) {
          face.reacting = angry;
          showExpression(angry ? 'sad' : face.lifted ? 'scared' : 'curious');
          changed = true;
        }
      } else if (!reducedMotion && face.elapsed >= .9 && face.presented) {
        face.openMouth.visible = !face.openMouth.visible;
        face.mouth.visible = !face.openMouth.visible;
        face.elapsed = 0;
        face.presented = false;
        changed = true;
      }
    }
    if (reducedMotion && face.openMouth.visible) {
      face.openMouth.visible = false;
      face.mouth.visible = true;
      changed = true;
    }
    return changed || face.reacting || (face.lifted && !reducedMotion);
  }
  setFaceLifted(false);
  tube('pear-boy brown stem', [
    new THREE.Vector3(0, 6.8, 0),
    new THREE.Vector3(.05, 7.55, -.05),
    new THREE.Vector3(-.25, 8.02, 0),
  ], .22, brown);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(-.75, .2, -1.6, -.3, -1.8, -1.15);
  leafShape.bezierCurveTo(-.65, -1.3, -.05, -.65, 0, 0);
  mesh('pear-boy green leaf', new THREE.ExtrudeGeometry(leafShape, {
    depth: .08, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, steps: 1,
  }), green, new THREE.Vector3(0, 7.5, .2));
  tube('pear-boy leaf vein', [
    new THREE.Vector3(-.04, 7.48, .34),
    new THREE.Vector3(-.85, 6.99, .34),
    new THREE.Vector3(-1.69, 6.39, .34),
  ], .025, new THREE.MeshStandardMaterial({ color: '#7fa337', roughness: .75 }));
  const shadow = canvasTexture(128, 128, (context, width, height) => {
    const gradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, '#0007');
    gradient.addColorStop(1, '#0000');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
  const contact = mesh('pear-boy soft contact shadow', new THREE.PlaneGeometry(6.6, 6.6),
    new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false,
      clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 0, -1), 10)] }),
    new THREE.Vector3(0, .012, .15));
  contact.rotation.x = -Math.PI / 2;
  contact.userData.pearBoy = false;
  const lights = [];
  for (const x of [-1.1, 1.1]) for (const z of [-1, 1]) {
    const light = new THREE.PointLight('#ffd9a8', 560, 70, 2);
    light.name = 'pear-boy diffuse warm emitter';
    light.position.set(x, 4.4, z);
    root.add(light);
    lights.push(light);
  }
  const light = lights[0];
  // Keep the translucent shell from blocking its own interior light.
  body.castShadow = false;
  const bounds = new THREE.Box3().setFromObject(root);
  bounds.expandByPoint(new THREE.Vector3(-4.5, 0, -4.5));
  bounds.expandByPoint(new THREE.Vector3(4.5, 0, 4.5));
  const point = new THREE.Vector3(), tangent = new THREE.Vector3(), normal = new THREE.Vector3();
  const binormal = new THREE.Vector3(), radial = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function paintLimb({ physics, curve, rope, tip }) {
    physics.positions.forEach((position, index) => curve.points[index].copy(position).sub(root.position));
    const positions = rope.geometry.attributes.position, normals = rope.geometry.attributes.normal;
    for (let i = 0; i <= 24; i++) {
      curve.getPoint(i / 24, point);
      curve.getTangent(i / 24, tangent);
      if (!i) normal.crossVectors(tangent, Math.abs(tangent.y) > .95 ? radial.set(0, 0, 1) : up).normalize();
      else normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      binormal.crossVectors(tangent, normal).normalize();
      for (let j = 0; j <= 6; j++) {
        const angle = j / 6 * Math.PI * 2, index = i * 7 + j;
        radial.copy(normal).multiplyScalar(-Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
        normals.setXYZ(index, radial.x, radial.y, radial.z);
        radial.multiplyScalar(physics.radius).add(point);
        positions.setXYZ(index, radial.x, radial.y, radial.z);
      }
    }
    positions.needsUpdate = normals.needsUpdate = true;
    rope.geometry.computeBoundingBox();
    rope.geometry.computeBoundingSphere();
    tip.position.copy(curve.points.at(-1));
    if (physics.tipSupported) tip.quaternion.identity();
    else tip.quaternion.setFromUnitVectors(up, tangent.subVectors(curve.points.at(-2), tip.position).normalize());
  }
  function resetLimbs() {
    for (const limb of limbs) { limb.physics.settle(root.position); paintLimb(limb); }
  }
  function updateLimbs(delta, reducedMotion) {
    let changed = false;
    for (const limb of limbs) {
      if (reducedMotion) {
        if (!limb.physics.sleeping || !limb.physics.origin.equals(root.position)) {
          limb.physics.settle(root.position);
          paintLimb(limb);
          changed = true;
        }
      } else if (limb.physics.update(root.position, delta)) {
        paintLimb(limb);
        changed = true;
      }
    }
    return changed;
  }
  resetLimbs();
  return { root, body, light, lights, bounds, contact, limbs, resetLimbs, updateLimbs,
    face, setFaceLifted, reactToImpact, acknowledgeFacePaint, updateFace };
}
