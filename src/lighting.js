import * as THREE from 'three';
import { RectAreaLightUniformsLib } from '../vendor/RectAreaLightUniformsLib.js';
import { canvasTexture, createWood } from './handheld.js';

const METERS_PER_UNIT = .017;
const linearChannel = Float32Array.from({ length: 256 }, (_, value) =>
  new THREE.Color().setRGB(value / 255, 0, 0).convertSRGBToLinear().r);

export function createDeskLamp() {
  const root = new THREE.Group();
  root.name = 'Paper lantern table lamp';
  const body = new THREE.Group();
  body.name = 'Full-size lantern';
  body.scale.setScalar(7);
  body.position.set(-13.5, 0, 2);
  root.add(body);
  const wood = new THREE.MeshStandardMaterial({ map: createWood(), color: '#a17647', roughness: .72 });
  const trim = new THREE.MeshStandardMaterial({ color: '#76512d', roughness: .85 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#141a1d', roughness: .9 });
  function mesh(name, geometry, material, position) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.copy(position);
    object.castShadow = object.receiveShadow = true;
    object.userData.lampToggle = true;
    body.add(object);
    return object;
  }
  const base = new THREE.Vector3(0, .16, 0);
  mesh('Wooden lamp base', new THREE.CylinderGeometry(1.02, 1.08, .32, 48), wood, base);
  mesh('Lamp base foot', new THREE.CylinderGeometry(1.02, 1.02, .06, 48), rubber,
    new THREE.Vector3(base.x, .035, base.z));
  mesh('Wooden lamp stem', new THREE.CylinderGeometry(.19, .23, 1.5, 32), wood,
    new THREE.Vector3(base.x, 1.05, base.z));
  const switchCap = mesh('Lamp switch', new THREE.CylinderGeometry(.18, .18, .12, 24), trim,
    new THREE.Vector3(base.x + .95, .37, base.z + .2));
  const paper = canvasTexture(256, 512, (context, width, height) => {
    context.fillStyle = '#e6d3ad';
    context.fillRect(0, 0, width, height);
    let seed = 73;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 4500; i++) {
      const x = random() * width, y = random() * height;
      context.strokeStyle = `rgba(99,66,33,${.04 + random() * .13})`;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + (random() - .5) * 3, y + 2 + random() * 12);
      context.stroke();
    }
  });
  const shade = mesh('Cylindrical paper shade', new THREE.CylinderGeometry(1.12, 1.12, 3.4, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: '#ead9bc', map: paper, roughness: .95,
      emissive: '#ffc078', emissiveMap: paper, emissiveIntensity: 25, side: THREE.DoubleSide }),
    new THREE.Vector3(base.x, 3.25, base.z));
  // Thin paper transmits the bulb instead of casting an opaque cylinder shadow.
  shade.castShadow = false;
  for (const [y, rotation] of [[1.55, Math.PI / 2], [4.95, -Math.PI / 2]]) {
    const cover = mesh('Paper shade diffuser', new THREE.CircleGeometry(1.1, 64), shade.material,
      new THREE.Vector3(base.x, y, base.z));
    cover.rotation.x = rotation;
    cover.castShadow = false;
  }
  for (const y of [1.55, 4.95]) {
    const rim = mesh('Paper shade rim', new THREE.TorusGeometry(1.12, .025, 8, 64), trim,
      new THREE.Vector3(base.x, y, base.z));
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = false;
  }
  const diffuser = mesh('Lantern bulb', new THREE.SphereGeometry(.18, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#ffead0', emissive: '#ffd299', emissiveIntensity: 80 }),
    new THREE.Vector3(base.x, 3.25, base.z));
  diffuser.castShadow = false;
  const light = new THREE.PointLight('#ffca8a', 18 / METERS_PER_UNIT ** 2, 0, 2);
  light.name = 'Paper lantern bulb light';
  light.position.copy(diffuser.position);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.camera.near = .7;
  light.shadow.camera.far = 120;
  light.shadow.bias = -.00012;
  light.shadow.normalBias = .008;
  light.shadow.radius = 16;
  // RectAreaLight dimensions do not inherit its parent's scale.
  const diffuse = new THREE.RectAreaLight('#ffcf95', 180, 14.7, 22.4);
  diffuse.name = 'Transmitted paper light';
  diffuse.position.set(base.x + .8, 3.25, base.z + .8);
  diffuse.lookAt(13.5 / 7, 2 / 7, -1.8 / 7);
  // A finite upward patch approximates the first warm bounce off the lit wood.
  const bounce = new THREE.RectAreaLight('#dfac7d', 50, 6, 6);
  bounce.name = 'Lamp tabletop bounce';
  bounce.position.set(0, .025, .2);
  bounce.rotation.x = Math.PI / 2;
  body.add(light, diffuse);
  root.add(bounce);
  return { root, light, diffuse, bounce, diffuser, shade, switchCap };
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
    this.light.intensity = peak * 120;
    if (peak > 0) this.light.color.copy(this.current).multiplyScalar(1 / peak);
  }
}
