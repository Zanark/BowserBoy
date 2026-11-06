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
    calm: new THREE.Group(), scared: new THREE.Group(), eyes: [],
    anchor: new THREE.Object3D(), gaze: new THREE.Vector2(), lifted: false, elapsed: 0,
  };
  face.calm.name = 'pear-boy curious face';
  face.scared.name = 'pear-boy scared-of-heights face';
  face.scared.visible = false;
  root.add(face.calm, face.scared);
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
      front(side * .98, 4.86, .06),
      front(side * .58, 4.5, .06),
      front(side * .84, 4.2, .06),
    ], .055, ink);
    face.scared.add(squint);
    for (const [x, y] of [[1.05, 4.25], [1.16, 4.03], [.92, 4.04]]) {
      const dot = mesh('pear-boy cheek freckle', new THREE.SphereGeometry(.055, 10, 8), freckles, front(side * x, y));
      dot.scale.z = .4;
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
    return front(-.72 + t * 1.44, 3.48 + Math.cos(t * Math.PI * 6) * .095, .08);
  }), .055, ink);
  face.scared.add(face.mouth);
  function setFaceLifted(lifted) {
    face.lifted = lifted;
    face.calm.visible = !lifted;
    face.scared.visible = lifted;
    face.elapsed = 0;
    face.mouth.position.set(0, 0, 0);
    root.userData.expression = lifted ? 'scared' : 'curious';
  }
  function updateFace(delta, target, reducedMotion) {
    const previousX = face.gaze.x, previousY = face.gaze.y;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-12 * delta);
    face.gaze.lerp(target, blend);
    if (face.gaze.distanceToSquared(target) < 1e-7) face.gaze.copy(target);
    const changed = face.gaze.x !== previousX || face.gaze.y !== previousY;
    if (changed) for (const { mesh, side } of face.eyes) {
      mesh.position.copy(front(side * .66 + face.gaze.x * .16, 4.5 + face.gaze.y * .14));
    }
    if (face.lifted) {
      face.elapsed += Math.min(delta, .05);
      face.mouth.position.x = reducedMotion ? 0 : Math.sin(face.elapsed * 25) * .035;
      face.mouth.position.y = reducedMotion ? 0 : Math.sin(face.elapsed * 19) * .025;
    }
    return changed || (face.lifted && !reducedMotion);
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
    new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false }),
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
    if (physics.positions.at(-1).y <= physics.tipFloor + .01) tip.quaternion.identity();
    else tip.quaternion.setFromUnitVectors(up, tangent.subVectors(curve.points.at(-2), tip.position).normalize());
  }
  function resetLimbs() {
    for (const limb of limbs) { limb.physics.reset(root.position); paintLimb(limb); }
  }
  function updateLimbs(delta, reducedMotion) {
    let changed = false;
    for (const limb of limbs) {
      if (reducedMotion) {
        if (!limb.physics.sleeping || !limb.physics.origin.equals(root.position)) {
          limb.physics.reset(root.position);
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
  return { root, body, light, lights, bounds, contact, limbs, resetLimbs, updateLimbs, face, setFaceLifted, updateFace };
}
