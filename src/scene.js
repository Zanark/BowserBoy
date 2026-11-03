import * as THREE from 'three';
import { canvasTexture, createCartridge, createHandheld, createWood } from './handheld.js';

const tableQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -.2));
const playQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.035, -.025, 0));
const playPosition = new THREE.Vector3(0, 3.5, 0);
const tablePosition = new THREE.Vector3(-.6, .68, .4);

export class HandheldScene {
  constructor(host, { onTools, onView, onError }) {
    this.host = host;
    this.onView = onView;
    this.mode = 'table';
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.id = 'scene-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'Interactive 3D handheld. Click to pick up. Inspect mode: drag or use arrow keys to rotate, plus and minus to zoom, Home to reset.');
    host.append(this.canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#d4c7b1');
    this.camera = new THREE.PerspectiveCamera(36, 1, .1, 180);
    this.lookAt = new THREE.Vector3();
    this.scene.add(new THREE.HemisphereLight('#fff0d3', '#6a5870', 2.2));
    const light = new THREE.DirectionalLight('#fff1d2', 4.2);
    light.position.set(-7, 16, 9);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: .5, far: 45 });
    light.shadow.bias = -.00035;
    light.shadow.normalBias = .025;
    this.scene.add(light);
    const fill = new THREE.DirectionalLight('#d1d8ff', 1.5);
    fill.position.set(9, 7, -6);
    this.scene.add(fill);
    const table = new THREE.Mesh(new THREE.BoxGeometry(32, .75, 23),
      new THREE.MeshStandardMaterial({ map: createWood(), color: '#cfb28f', roughness: .83 }));
    table.position.y = -.375;
    table.receiveShadow = true;
    this.scene.add(table);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ color: '#c6bda9', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.scene.add(floor);
    for (const [color, title, subtitle, x, z, angle] of [
      ['#648579', 'DAYDREAM', 'EMPTY CARTRIDGE', 4.3, -1.9, .42],
      ['#b2a7b5', 'LITTLE WORLDS', 'EMPTY CARTRIDGE', 5.6, -.2, -.16],
      ['#aaa48b', 'BBA', 'HOME BREW', -4.8, 3.5, -.43],
    ]) {
      const cartridge = createCartridge(color, title, subtitle);
      cartridge.position.set(x, .18, z);
      cartridge.rotation.set(-Math.PI / 2, 0, angle);
      this.scene.add(cartridge);
    }
    this.model = createHandheld();
    this.scene.add(this.model.root);
    this.model.root.position.copy(tablePosition);
    this.model.root.quaternion.copy(tableQuaternion);
    this.pressed = new Set();
    this.showStatus('INSERT CARTRIDGE', 'ESC / CARTRIDGES & SETTINGS');
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.zoom = 1;
    this.drag = null;
    this.inspectionPointers = new Map();
    this.pinch = null;
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.canvas.focus({ preventScroll: true });
      if (this.mode === 'inspecting') {
        this.inspectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.inspectionPointers.size === 1) {
          this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation: this.model.root.quaternion.clone() };
        } else if (this.inspectionPointers.size === 2) {
          const [a, b] = this.inspectionPointers.values();
          this.pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
          this.drag = null;
        }
        this.canvas.setPointerCapture(event.pointerId);
      } else if (!this.transition) {
        const hit = this.pick(event);
        if (!hit) return;
        if (this.mode === 'table') this.setView('playing');
        else if (hit.object.userData.tools) onTools();
      }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (this.inspectionPointers.has(event.pointerId)) {
        this.inspectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (this.pinch && this.inspectionPointers.size === 2) {
        const [a, b] = this.inspectionPointers.values();
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 0) this.setZoom(this.pinch.zoom * this.pinch.distance / distance);
      } else if (this.drag?.id === event.pointerId) {
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (event.clientX - this.drag.x) * .008);
        const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (event.clientY - this.drag.y) * .008);
        this.model.root.quaternion.copy(yaw.multiply(pitch).multiply(this.drag.rotation));
      } else {
        this.canvas.style.cursor = this.mode === 'inspecting' ? 'grab' : this.pick(event) ? 'pointer' : 'default';
      }
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.canvas.addEventListener(name, (event) => {
        this.inspectionPointers.delete(event.pointerId);
        this.drag = null;
        this.pinch = null;
        if (this.inspectionPointers.size === 1) {
          const [id, point] = this.inspectionPointers.entries().next().value;
          this.drag = { id, ...point, rotation: this.model.root.quaternion.clone() };
        }
      });
    }
    this.canvas.addEventListener('wheel', (event) => {
      if (this.mode !== 'inspecting') return;
      event.preventDefault();
      this.setZoom(this.zoom * Math.exp(event.deltaY * .001));
    }, { passive: false });
    this.canvas.addEventListener('keydown', (event) => {
      if (this.mode !== 'inspecting' || event.ctrlKey || event.altKey || event.metaKey) return;
      const rotations = { ArrowLeft: [0, -.15], ArrowRight: [0, .15], ArrowUp: [-.15, 0], ArrowDown: [.15, 0] };
      if (rotations[event.code]) {
        event.preventDefault();
        const [pitch, yaw] = rotations[event.code];
        this.model.root.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0)));
      } else if (['Equal', 'NumpadAdd', 'Minus', 'NumpadSubtract', 'Home'].includes(event.code)) {
        event.preventDefault();
        if (event.code === 'Home') {
          this.model.root.quaternion.copy(playQuaternion);
          this.setZoom(1);
        } else this.setZoom(this.zoom * (['Equal', 'NumpadAdd'].includes(event.code) ? .9 : 1.1));
      }
    });
    this.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      onError(new Error('The 3D graphics context was lost. Your saves are unchanged; wait for graphics to recover or export a backup from Cartridges.'));
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.host.dispatchEvent(new CustomEvent('graphics-restored'));
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.camera.position.copy(this.cameraTarget);
    this.lookAt.copy(this.lookTarget);
    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  pick(event) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.model.root, true)[0];
  }

  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateCameraTargets();
    if (!this.transition) {
      this.camera.position.copy(this.cameraTarget);
      this.lookAt.copy(this.lookTarget);
    }
  }

  updateCameraTargets() {
    if (this.mode === 'table') {
      const scale = Math.max(1, 1.12 / this.camera.aspect);
      this.cameraTarget = new THREE.Vector3(5, 11, 12).multiplyScalar(scale);
      this.lookTarget = new THREE.Vector3(0, 0, .2);
    } else {
      const tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const padding = this.height < 500 ? 110 : 180;
      const distance = Math.max(10.2 / this.camera.aspect, 5.55 * this.height / Math.max(160, this.height - padding)) / (2 * tangent);
      this.cameraTarget = new THREE.Vector3(0, playPosition.y + .1, distance * this.zoom);
      this.lookTarget = playPosition.clone();
    }
  }

  setZoom(value) {
    this.zoom = THREE.MathUtils.clamp(value, .65, 1.65);
    this.updateCameraTargets();
    this.camera.position.copy(this.cameraTarget);
  }

  setView(mode) {
    if (!['table', 'playing', 'inspecting'].includes(mode)) throw new Error('Unknown handheld view.');
    if (mode === this.mode && !this.transition) return;
    this.drag = null;
    this.inspectionPointers.clear();
    this.pinch = null;
    this.mode = mode;
    this.zoom = 1;
    this.updateCameraTargets();
    this.transition = {
      started: performance.now(), duration: this.reducedMotion.matches ? 0 : 850,
      position: this.model.root.position.clone(), rotation: this.model.root.quaternion.clone(),
      camera: this.camera.position.clone(), look: this.lookAt.clone(),
      targetPosition: mode === 'table' ? tablePosition : playPosition,
      targetRotation: mode === 'table' ? tableQuaternion : playQuaternion,
    };
    this.host.dataset.view = 'moving';
    this.onView(mode, true);
    this.canvas.focus({ preventScroll: true });
  }

  setPower(running) {
    this.model.led.material.color.set(running ? '#bce76f' : '#495537');
    this.model.led.material.emissive.set(running ? '#75b62b' : '#000000');
    this.model.led.material.emissiveIntensity = running ? 1.2 : 0;
    this.model.controls.get('power').mesh.position.x = running ? 1.65 : 1.45;
  }

  setControl(action, pressed) {
    if (pressed) this.pressed.add(action); else this.pressed.delete(action);
  }

  showPowerOff() {
    this.source = null;
    const material = this.model.screen.material;
    const previous = material.map;
    material.map = null;
    material.color.set('#18201b');
    material.needsUpdate = true;
    previous?.dispose();
  }

  setScreen(canvas) {
    const previous = this.model.screen.material.map;
    this.source = canvas;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    this.model.screen.material.map = texture;
    this.model.screen.material.color.set('white');
    this.model.screen.material.needsUpdate = true;
    previous?.dispose();
  }

  showStatus(title, detail) {
    this.source = null;
    this.model.screen.material.color.set('white');
    const previous = this.model.screen.material.map;
    this.model.screen.material.map = canvasTexture(720, 480, (context, width, height) => {
      context.fillStyle = '#b1c19d';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#35513d';
      context.textAlign = 'center';
      context.font = 'italic 900 70px Arial';
      context.fillText('BOWSER BOY', width / 2, 176);
      context.font = 'italic 900 48px Arial';
      context.fillText('ADVANCE', width / 2, 227);
      context.font = 'bold 22px monospace';
      context.fillText(title, width / 2, 324, width - 40);
      context.font = '16px monospace';
      context.fillText(detail, width / 2, 367, width - 40);
    });
    this.model.screen.material.needsUpdate = true;
    previous?.dispose();
  }

  project(object) {
    const point = object.getWorldPosition(new THREE.Vector3()).project(this.camera);
    return { x: (point.x + 1) * this.width / 2, y: (1 - point.y) * this.height / 2 };
  }

  render(time) {
    if (this.transition) {
      const transition = this.transition;
      const fraction = transition.duration ? Math.min(1, (time - transition.started) / transition.duration) : 1;
      const ease = fraction * fraction * (3 - 2 * fraction);
      this.model.root.position.lerpVectors(transition.position, transition.targetPosition, ease);
      this.model.root.quaternion.slerpQuaternions(transition.rotation, transition.targetRotation, ease);
      this.camera.position.lerpVectors(transition.camera, this.cameraTarget, ease);
      this.lookAt.lerpVectors(transition.look, this.lookTarget, ease);
      if (fraction === 1) {
        this.transition = null;
        this.host.dataset.view = this.mode;
        this.onView(this.mode, false);
      }
    } else this.host.dataset.view = this.mode;
    this.camera.lookAt(this.lookAt);
    for (const item of new Set([...this.model.controls.values()].map(({ mesh }) => mesh))) {
      const entries = [...this.model.controls.entries()].filter(([, value]) => value.mesh === item);
      item.position.z = entries[0][1].rest - (entries.some(([id]) => this.pressed.has(id)) ? .055 : 0);
    }
    if (this.source) this.model.screen.material.map.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    for (const [id, control] of this.model.controls) {
      const button = id === 'power' ? document.getElementById('hardware-power') : document.querySelector(`[data-control="${id}"]`);
      if (!button) continue;
      button.hidden = this.mode !== 'playing' || !!this.transition;
      if (button.hidden) continue;
      const point = this.project(control.anchor);
      const distance = this.camera.position.distanceTo(control.anchor.getWorldPosition(new THREE.Vector3()));
      const scale = this.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance);
      button.style.left = `${point.x}px`;
      button.style.top = `${point.y}px`;
      button.style.width = `${Math.max(14, control.width * scale)}px`;
      button.style.height = `${Math.max(14, control.height * scale)}px`;
    }
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.observer.disconnect();
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material) { material.map?.dispose(); material.dispose(); }
      }
    });
    this.renderer.dispose();
  }
}
