import * as THREE from 'three';
import { RectAreaLightUniformsLib } from '../vendor/RectAreaLightUniformsLib.js';
import { canvasTexture } from './handheld.js';

const METERS_PER_UNIT = .017;
const linearChannel = Float32Array.from({ length: 256 }, (_, value) =>
  new THREE.Color().setRGB(value / 255, 0, 0).convertSRGBToLinear().r);

export function createDeskLamp() {
  const root = new THREE.Group();
  root.name = 'STORSEGEL-style table lamp';
  const body = new THREE.Group();
  body.name = 'White shade and ash tripod';
  body.scale.setScalar(1 / METERS_PER_UNIT);
  body.position.set(-13.5, 0, 2);
  root.add(body);
  const grain = canvasTexture(128, 512, (context, width, height) => {
    context.fillStyle = '#ddc7a6';
    context.fillRect(0, 0, width, height);
    for (let x = 0; x < width; x += 4) {
      context.strokeStyle = `rgba(109,83,48,${.025 + x % 12 / 360})`;
      context.beginPath();
      context.moveTo(x, 0);
      for (let y = 16; y <= height; y += 16) context.lineTo(x + Math.sin(y * .025 + x) * 1.2, y);
      context.stroke();
    }
  });
  const wood = new THREE.MeshStandardMaterial({ map: grain, roughness: .72 });
  const trim = new THREE.MeshStandardMaterial({ color: '#f5f3ed', roughness: .8 });
  function mesh(name, geometry, material, position) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.copy(position);
    object.castShadow = object.receiveShadow = true;
    object.userData.lampToggle = true;
    body.add(object);
    return object;
  }
  const legShape = new THREE.Shape();
  legShape.moveTo(.076, 0);
  legShape.lineTo(.094, 0);
  legShape.lineTo(.027, .174);
  legShape.lineTo(.009, .174);
  legShape.closePath();
  const legGeometry = new THREE.ExtrudeGeometry(legShape, { depth: .013, bevelEnabled: false });
  legGeometry.translate(0, 0, -.0065);
  for (let index = 0; index < 3; index++) {
    const leg = mesh(`Ash tripod leg ${index + 1}`, legGeometry, wood, new THREE.Vector3());
    leg.rotation.y = .35 + index * Math.PI * 2 / 3;
  }
  mesh('Lamp shade support', new THREE.CylinderGeometry(.022, .022, .018, 24), trim,
    new THREE.Vector3(0, .162, 0));
  const shade = mesh('Clean white drum shade', new THREE.CylinderGeometry(.09, .09, .15, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: '#fffefa', roughness: .95,
      emissive: '#fff0d6', emissiveIntensity: 60, side: THREE.DoubleSide }),
    new THREE.Vector3(0, .225, 0));
  // Keep the clean fabric luminous without the old brown albedo/emission speckles.
  shade.castShadow = false;
  for (const y of [.15, .30]) {
    const rim = mesh('White shade rim', new THREE.TorusGeometry(.0895, .0005, 8, 96), shade.material,
      new THREE.Vector3(0, y, 0));
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = false;
  }
  const diffuser = mesh('Warm lamp bulb', new THREE.SphereGeometry(.018, 20, 16),
    new THREE.MeshStandardMaterial({ color: '#fff8ec', emissive: '#fff0d6', emissiveIntensity: 80 }),
    new THREE.Vector3(0, .215, 0));
  diffuser.castShadow = false;
  const light = new THREE.SpotLight('#ffca8a', 12 / METERS_PER_UNIT ** 2, 0, Math.PI / 3, .65, 2);
  light.name = 'Tripod lamp downward light';
  light.position.copy(diffuser.position);
  light.target.position.set(13.5 * METERS_PER_UNIT, .2 * METERS_PER_UNIT, -2 * METERS_PER_UNIT);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = .7;
  light.shadow.camera.far = 120;
  light.shadow.bias = -.00012;
  light.shadow.normalBias = .008;
  light.shadow.radius = 16;
  // RectAreaLight dimensions do not inherit its parent's scale.
  const diffuse = new THREE.RectAreaLight('#ffcf95', 300, .18 / METERS_PER_UNIT, .15 / METERS_PER_UNIT);
  diffuse.name = 'Transmitted shade light';
  // An emitting plane intersecting the fabric produces a hard LTC lighting seam.
  diffuse.position.set(.11, .225, .03);
  diffuse.lookAt(1.06, .025, .28);
  const underShade = new THREE.RectAreaLight('#ffdfb5', 90, .16 / METERS_PER_UNIT, .16 / METERS_PER_UNIT);
  underShade.name = 'Soft light through the open shade bottom';
  underShade.position.set(0, .149, 0);
  underShade.rotation.x = -Math.PI / 2;
  // A finite upward patch approximates the first warm bounce off the lit wood.
  const bounce = new THREE.RectAreaLight('#dfac7d', 50, 6, 6);
  bounce.name = 'Lamp tabletop bounce';
  bounce.position.set(0, .025, .2);
  bounce.rotation.x = Math.PI / 2;
  body.add(light, light.target, diffuse, underShade);
  root.add(bounce);
  return { root, light, diffuse, underShade, bounce, diffuser, shade };
}

export function createRoomLighting() {
  const root = new THREE.Group();
  root.name = 'Switchable room lighting';
  const ceiling = new THREE.RectAreaLight('#ffe5c7', 120, 14, 12);
  ceiling.name = 'Diffuse ceiling light';
  ceiling.position.set(0, 10, 5);
  ceiling.lookAt(0, 0, 0);
  const reflected = new THREE.HemisphereLight('#ffe3bf', '#654333', 20);
  reflected.name = 'Room reflected light';
  root.add(ceiling, reflected);
  return root;
}

export class ScreenIllumination {
  constructor(screen) {
    RectAreaLightUniformsLib.init();
    const { width, height } = screen.geometry.userData.viewport;
    this.light = new THREE.RectAreaLight('white', 0, width, height);
    this.light.name = 'LCD area emission';
    this.light.rotation.y = Math.PI;
    screen.add(this.light);
    this.light.position.z = .002;
    // Experimental first-bounce fill: the forward emitter cannot light coplanar controls.
    this.controlSpill = new THREE.RectAreaLight('white', 0, width * 2, height * 2);
    this.controlSpill.name = 'Experimental LCD control spill';
    this.controlSpill.position.z = 1.2;
    screen.add(this.controlSpill);
    this.canvas = document.createElement('canvas');
    this.canvas.width = 24;
    this.canvas.height = 16;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true, alpha: false });
    if (!this.context) throw new Error('Screen illumination needs a 2D sampling canvas.');
    this.context.imageSmoothingEnabled = false;
    this.target = new THREE.Color(0, 0, 0);
    this.current = new THREE.Color(0, 0, 0);
    this.nextSample = 0;
    this.sampledSource = null;
    this.settled = true;
  }

  clear() {
    this.target.setRGB(0, 0, 0);
    this.current.copy(this.target);
    this.light.intensity = 0;
    this.controlSpill.intensity = 0;
    this.nextSample = 0;
    this.sampledSource = null;
    this.settled = true;
  }

  update(source, time, delta, live = true) {
    if (!source) return;
    if (source !== this.sampledSource || (live && time >= this.nextSample)) {
      this.context.drawImage(source, 0, 0, 24, 16);
      const { data } = this.context.getImageData(0, 0, 24, 16);
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += linearChannel[data[i]];
        g += linearChannel[data[i + 1]];
        b += linearChannel[data[i + 2]];
      }
      this.target.setRGB(r / 384, g / 384, b / 384);
      this.nextSample = time + 125;
      this.sampledSource = source;
    }
    this.current.lerp(this.target, 1 - Math.exp(-delta * 18));
    this.settled = Math.max(Math.abs(this.current.r - this.target.r),
      Math.abs(this.current.g - this.target.g), Math.abs(this.current.b - this.target.b)) < .00001;
    if (this.settled) this.current.copy(this.target);
    const peak = Math.max(this.current.r, this.current.g, this.current.b);
    this.light.intensity = peak * 12;
    // Reveal controls in darker scenes without lifting black or the full-white level.
    this.controlSpill.intensity = Math.pow(peak, .25) * .1;
    if (peak > 0) this.light.color.copy(this.current).multiplyScalar(1 / peak);
    this.controlSpill.color.copy(this.light.color);
  }
}
