import * as THREE from 'three';
import { RectAreaLightUniformsLib } from '../vendor/RectAreaLightUniformsLib.js';

const METERS_PER_UNIT = .017;
const linearChannel = Float32Array.from({ length: 256 }, (_, value) =>
  new THREE.Color().setRGB(value / 255, 0, 0).convertSRGBToLinear().r);

export function createDeskLamp() {
  const root = new THREE.Group();
  root.name = 'Desk lamp';
  const enamel = new THREE.MeshStandardMaterial({ color: '#283e39', roughness: .32, metalness: .18 });
  const brass = new THREE.MeshStandardMaterial({ color: '#a18c58', roughness: .35, metalness: .7 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#141a1d', roughness: .9 });
  function mesh(name, geometry, material, position) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.copy(position);
    object.castShadow = object.receiveShadow = true;
    object.userData.lampToggle = true;
    root.add(object);
    return object;
  }
  function arm(from, to, radius) {
    const direction = to.clone().sub(from);
    const object = mesh('Lamp arm', new THREE.CylinderGeometry(radius, radius, direction.length(), 20),
      brass, from.clone().add(to).multiplyScalar(.5));
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
  const base = new THREE.Vector3(-6.3, .16, 0);
  mesh('Weighted lamp base', new THREE.CylinderGeometry(1.05, 1.18, .32, 48), enamel, base);
  mesh('Lamp base foot', new THREE.CylinderGeometry(1.14, 1.14, .06, 48), rubber,
    new THREE.Vector3(base.x, .035, base.z));
  const elbow = new THREE.Vector3(-6.7, 5.6, 1);
  const top = new THREE.Vector3(-4.3, 8.4, 4);
  arm(base, elbow, .13);
  arm(elbow, top, .11);
  mesh('Lamp hinge', new THREE.SphereGeometry(.27, 24, 16), enamel, elbow);
  const switchCap = mesh('Lamp switch', new THREE.CylinderGeometry(.18, .18, .12, 24), brass,
    new THREE.Vector3(base.x + .55, .37, base.z + .25));
  const head = new THREE.Group();
  head.position.copy(top);
  const target = new THREE.Object3D();
  target.position.set(0, 1.8, .2);
  const direction = target.position.clone().sub(top).normalize();
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction);
  root.add(head);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.35, .92, 1.45, 48, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#85a990', roughness: .45, clearcoat: .6,
      emissive: '#8db59a', emissiveIntensity: 12, side: THREE.DoubleSide }));
  shade.name = 'Diffusing green lamp shade';
  shade.castShadow = shade.receiveShadow = true;
  shade.userData.lampToggle = true;
  head.add(shade);
  const diffuser = new THREE.Mesh(new THREE.CircleGeometry(.84, 48),
    new THREE.MeshStandardMaterial({ color: '#f1e4c7', emissive: '#ffe2b7', emissiveIntensity: 1.5, roughness: .8 }));
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.y = -.73;
  diffuser.userData.lampToggle = true;
  head.add(diffuser);
  const light = new THREE.SpotLight('#ffe3bd', 12 / METERS_PER_UNIT ** 2, 0, .63, .45, 2);
  light.name = 'Lamp spotlight';
  light.position.copy(top).addScaledVector(direction, .82);
  light.target = target;
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.near = .1;
  light.shadow.camera.far = 35;
  light.shadow.bias = -.00012;
  light.shadow.normalBias = .008;
  light.shadow.radius = 2;
  // A finite upward patch approximates the first warm bounce off the lit wood.
  const bounce = new THREE.RectAreaLight('#dfac7d', 8, 6, 6);
  bounce.name = 'Lamp tabletop bounce';
  bounce.position.set(0, .025, .2);
  bounce.rotation.x = Math.PI / 2;
  root.add(light, target, bounce);
  return { root, light, bounce, diffuser, shade, switchCap };
}

export class ScreenIllumination {
  constructor(screen) {
    RectAreaLightUniformsLib.init();
    this.light = new THREE.RectAreaLight('white', 0,
      screen.geometry.parameters.width, screen.geometry.parameters.height);
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
    this.settled = Math.max(...['r', 'g', 'b'].map((channel) =>
      Math.abs(this.current[channel] - this.target[channel]))) < .00001;
    if (this.settled) this.current.copy(this.target);
    const peak = Math.max(this.current.r, this.current.g, this.current.b);
    this.light.intensity = peak * 120;
    if (peak > 0) this.light.color.copy(this.current).multiplyScalar(1 / peak);
  }
}
