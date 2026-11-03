import * as THREE from 'three';
import { canvasTexture, createCartridge, createHandheld, createWood } from './handheld.js';
import { createDeskLamp, ScreenIllumination } from './lighting.js';

const tableQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -.2));
const playQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.035, -.025, 0));
const playPosition = new THREE.Vector3(0, 3.5, 0);
const tablePosition = new THREE.Vector3(-.6, .68, .4);

export class HandheldScene {
  constructor(host, { onTools, onView, onError, onLamp }) {
    this.host = host;
    this.onView = onView;
    this.onError = onError;
    this.mode = 'table';
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .015;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.canvas = this.renderer.domElement;
    this.canvas.id = 'scene-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'Interactive 3D handheld. Click to pick up. Inspect mode: drag or use arrow keys to rotate, plus and minus to zoom, Home to reset.');
    host.append(this.canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    this.camera = new THREE.PerspectiveCamera(36, 1, .1, 180);
    this.lookAt = new THREE.Vector3();
    this.lamp = createDeskLamp();
    this.scene.add(this.lamp.root);
    this.setLamp(true);
    const table = new THREE.Mesh(new THREE.BoxGeometry(32, .75, 23),
      new THREE.MeshStandardMaterial({ map: createWood(), color: '#cfb28f', roughness: .83 }));
    table.position.y = -.375;
    table.receiveShadow = true;
    table.name = 'Wooden tabletop';
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
    this.screenIllumination = new ScreenIllumination(this.model.screen);
    this.scene.add(this.model.root);
    this.model.root.position.copy(tablePosition);
    this.model.root.quaternion.copy(tableQuaternion);
    this.pressed = new Set();
    this.controlGroups = [...new Set([...this.model.controls.values()].map(({ mesh }) => mesh))]
      .filter((mesh) => mesh !== this.model.controls.get('power').mesh)
      .map((mesh) => ({ mesh, ids: [...this.model.controls].filter(([, value]) => value.mesh === mesh).map(([id]) => id) }));
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
      const hit = this.pick(event);
      if (!this.transition && hit?.object.userData.lampToggle) { onLamp(); return; }
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
    return this.raycaster.intersectObjects([this.model.root, this.lamp.root], true)[0];
  }

  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.changed = true;
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
      this.cameraTarget = new THREE.Vector3(6, 13, 17).multiplyScalar(scale);
      this.lookTarget = new THREE.Vector3(-1, 2, 1);
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
    this.changed = true;
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
    this.model.led.material.emissive.set(running ? '#00b800' : '#000000');
    this.model.led.material.emissiveIntensity = running ? 80 : 0;
    const power = this.model.controls.get('power').mesh;
    const x = running ? 1.65 : 1.45;
    if (power.position.x !== x) this.changed = true;
    power.position.x = x;
  }

  setLamp(enabled) {
    this.changed = true;
    this.lampOn = enabled;
    this.lamp.light.visible = enabled;
    this.lamp.bounce.visible = enabled;
    this.lamp.diffuser.material.emissiveIntensity = enabled ? 1200 : 0;
    this.lamp.shade.material.emissiveIntensity = enabled ? 12 : 0;
    this.lamp.switchCap.position.y = enabled ? .34 : .37;
  }

  setControl(action, pressed) {
    if (pressed) this.pressed.add(action); else this.pressed.delete(action);
  }

  showPowerOff() {
    this.source = null;
    this.screenIllumination.clear();
    this.setDisplay(new THREE.MeshPhysicalMaterial({
      color: '#101713', roughness: .24, clearcoat: 1, clearcoatRoughness: .22,
    }));
  }

  setDisplay(material) {
    this.changed = true;
    const previous = this.model.screen.material;
    this.model.screen.material = material;
    previous.map?.dispose();
    previous.dispose();
  }

  setScreen(canvas) {
    this.source = canvas;
    this.screenIllumination.clear();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    this.setDisplay(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  }

  showStatus(title, detail) {
    this.source = null;
    this.screenIllumination.clear();
    const map = canvasTexture(720, 480, (context, width, height) => {
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
    this.setDisplay(new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  }

  project(object) {
    const point = object.getWorldPosition(new THREE.Vector3()).project(this.camera);
    return { x: (point.x + 1) * this.width / 2, y: (1 - point.y) * this.height / 2 };
  }

  render(time) {
    const delta = Math.max(0, (time - (this.lastRender ?? time - 16.67)) / 1000);
    this.lastRender = time;
    this.slowFrames = this.renderedLastFrame && delta > .05 ? (this.slowFrames ?? 0) + 1 : 0;
    this.renderedLastFrame = false;
    this.renderer.toneMappingExposure = THREE.MathUtils.damp(
      this.renderer.toneMappingExposure, this.lampOn ? .015 : .45, 4, delta);
    const exposure = this.lampOn ? .015 : .45;
    const adapting = Math.abs(this.renderer.toneMappingExposure - exposure) > .00001;
    if (!adapting) this.renderer.toneMappingExposure = exposure;
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
    let buttonsMoving = false;
    for (const { mesh, ids } of this.controlGroups) {
      const motion = mesh.userData.motion;
      const target = ids.some((id) => this.pressed.has(id)) ? 1 : 0;
      const previous = motion.press;
      motion.press = THREE.MathUtils.damp(motion.press, target, 55, delta);
      if (Math.abs(motion.press - target) < .00001) motion.press = target;
      buttonsMoving ||= motion.press !== previous;
      mesh.position.copy(motion.restPosition).addScaledVector(motion.travel, motion.press);
      if (ids.includes('up')) {
        const x = Number(this.pressed.has('down')) - Number(this.pressed.has('up'));
        const y = Number(this.pressed.has('right')) - Number(this.pressed.has('left'));
        const pitch = motion.pitch, yaw = motion.yaw;
        motion.pitch = THREE.MathUtils.damp(motion.pitch, x * .065, 55, delta);
        motion.yaw = THREE.MathUtils.damp(motion.yaw, y * .065, 55, delta);
        if (Math.abs(motion.pitch - x * .065) < .00001) motion.pitch = x * .065;
        if (Math.abs(motion.yaw - y * .065) < .00001) motion.yaw = y * .065;
        buttonsMoving ||= motion.pitch !== pitch || motion.yaw !== yaw;
        mesh.rotation.set(motion.pitch, motion.yaw, 0);
      } else {
        mesh.quaternion.copy(motion.restQuaternion);
        if (ids.includes('l') || ids.includes('r')) mesh.rotateX(-motion.press * .045);
      }
    }
    // Modal tools own interaction; keep the core running without redrawing its blurred backdrop.
    if (document.querySelector('dialog[open]')) return;
    if (this.slowFrames >= 6 && this.renderer.getPixelRatio() > .5) {
      this.renderer.setPixelRatio(Math.max(.5, this.renderer.getPixelRatio() * .75));
      this.slowFrames = 0;
      this.changed = true;
    }
    if (this.source) this.model.screen.material.map.needsUpdate = true;
    if (!this.screenIllumination.failed) {
      try { this.screenIllumination.update(this.source ?? this.model.screen.material.map?.image, time, delta, !!this.source); }
      catch (error) {
        this.screenIllumination.clear();
        this.screenIllumination.failed = true;
        this.onError(new Error(`LCD light sampling failed: ${error.message}. The game is retained; reload to retry lighting.`));
      }
    }
    const poseChanged = !this.lastPosition?.equals(this.model.root.position) ||
      !this.lastRotation?.equals(this.model.root.quaternion) || !this.lastCamera?.equals(this.camera.position);
    if (!this.source && !this.changed && !poseChanged && !buttonsMoving &&
        !adapting && this.screenIllumination.settled) return;
    this.renderer.shadowMap.needsUpdate ||= !!this.changed || poseChanged || buttonsMoving;
    this.renderer.render(this.scene, this.camera);
    this.renderedLastFrame = true;
    this.lastPosition = this.model.root.position.clone();
    this.lastRotation = this.model.root.quaternion.clone();
    this.lastCamera = this.camera.position.clone();
    this.changed = false;
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
