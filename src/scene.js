import * as THREE from 'three';
import { canvasTexture, createCartridge, createHandheld, createLcdGeometries, createWood } from './handheld.js';
import { createDeskLamp, createRoomLighting, ScreenIllumination } from './lighting.js';
import { brandImage } from './brand.js';
import { cartridgeFramingDuration, cartridgeSlideDuration, nextCartridgeElapsed } from './cartridge-motion.js';
import { nextTransitionElapsed } from './transition-motion.js';
import { createDsHandheld } from './ds-handheld.js';
import { createPearBoy } from './pear-boy.js';
import { DeskMotion, PearMotion } from './pear-motion.js';

const tableQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -.2));
const playQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.035, -.025, 0));
const playPosition = new THREE.Vector3(0, 3.5, 0);
const tablePosition = new THREE.Vector3(-.6, .68, .4);
const dsTablePosition = new THREE.Vector3(10.3, .32, -7.2);
const dsTableQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -.4));
const dsPlayPosition = new THREE.Vector3(5, 5.1, 8);
const dsPlayQuaternion = new THREE.Quaternion();
const dsTableHinge = THREE.MathUtils.degToRad(70);
const pearHome = new THREE.Vector3(15.3, 0, 7.3);

export class HandheldScene {
  constructor(host, { onTools, onView, onError, onLamp, onConsole }) {
    this.host = host;
    this.onView = onView;
    this.onError = onError;
    this.onConsole = onConsole;
    this.console = 'gba';
    this.dsInspectAction = 'body';
    this.dsGameplayPose = null;
    this.mode = 'table';
    this.nativeBusy = false;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .018;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.localClippingEnabled = true;
    this.canvas = this.renderer.domElement;
    const gl = this.renderer.getContext();
    this.paintSyncAvailable = ['fenceSync', 'clientWaitSync', 'deleteSync', 'flush']
      .every(method => typeof gl[method] === 'function');
    this.restoreRoomGpu = () => {
      this.paintFence = null;
      this.paintSyncFailed = false;
      this.nextPaint = 0;
      this.changed = true;
    };
    this.canvas.addEventListener('webglcontextrestored', this.restoreRoomGpu);
    this.canvas.id = 'scene-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'Interactive 3D desk. Drag a console or pear-boy in 3D, scroll for depth, release to drop. Console orientation stays fixed while moving. Click a console to play; click pear-boy to switch his light. Dock movement controls: arrows move, Page Up/Down lift, Enter drops, Escape cancels. Inspect: drag or arrows rotate, plus/minus zoom.');
    host.append(this.canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    this.camera = new THREE.PerspectiveCamera(36, 1, .1, 500);
    this.lookAt = new THREE.Vector3();
    this.lamp = createDeskLamp();
    this.scene.add(this.lamp.root);
    this.setLamp(true);
    this.roomLighting = createRoomLighting();
    this.scene.add(this.roomLighting);
    this.setRoomLights(false);
    const tableWood = createWood();
    tableWood.repeat.set(1000 / 16, 26 / 11.5);
    const edgeWood = createWood();
    edgeWood.repeat.set(1000 / 16, 2.4 / 11.5);
    const tabletop = new THREE.MeshStandardMaterial({ map: tableWood, color: '#cfb28f', roughness: .83 });
    const edge = new THREE.MeshStandardMaterial({ map: edgeWood, color: '#8d5734', roughness: .88 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(1000, 2.4, 26),
      [edge, edge, tabletop, edge, edge, edge]);
    table.position.set(0, -1.2, -3);
    table.castShadow = table.receiveShadow = true;
    table.name = 'Wooden tabletop';
    this.scene.add(table);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshStandardMaterial({ color: '#aa927c', roughness: 1 }));
    wall.name = 'Warm plaster room wall';
    wall.position.set(0, 464.5, -16);
    wall.receiveShadow = true;
    this.scene.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ color: '#c6bda9', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -35;
    floor.name = 'Room floor';
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.deskObjects = [];
    for (const [color, title, subtitle, x, z, angle] of [
      ['#648579', 'DAYDREAM', 'EMPTY CARTRIDGE', 4.3, -1.9, .42],
      ['#b2a7b5', 'LITTLE WORLDS', 'EMPTY CARTRIDGE', 5.6, -.2, -.16],
      ['#aaa48b', 'BBA', 'HOME BREW', -3.8, 4, -.43],
    ]) {
      const cartridge = createCartridge(color, title, subtitle);
      cartridge.position.set(x, .18, z);
      cartridge.rotation.set(-Math.PI / 2, 0, angle);
      this.scene.add(cartridge);
      this.deskObjects.push(cartridge);
    }
    this.model = createHandheld();
    this.model.root.userData.console = 'gba';
    this.screenCurved = true;
    this.screenIllumination = new ScreenIllumination(this.model.screen);
    this.scene.add(this.model.root);
    this.model.root.position.copy(tablePosition);
    this.model.root.quaternion.copy(tableQuaternion);
    this.ds = createDsHandheld();
    this.dsScreenIllumination = this.ds.screens.map(screen => new ScreenIllumination(screen));
    for (const illumination of this.dsScreenIllumination) {
      illumination.light.visible = illumination.controlSpill.visible = false;
    }
    this.ds.root.position.copy(dsTablePosition);
    this.ds.root.quaternion.copy(dsTableQuaternion);
    this.scene.add(this.ds.root);
    this.pear = createPearBoy();
    this.pear.root.position.copy(pearHome);
    this.pearMotion = new PearMotion(this.pear.root.position);
    this.pear.resetLimbs();
    this.scene.add(this.pear.root);
    this.consoleHomes = {};
    this.consolePoses = {};
    this.consoleMotions = {};
    for (const [system, model] of [['gba', this.model], ['ds', this.ds]]) {
      const { root } = model;
      this.consoleHomes[system] = root.position.clone();
      this.consolePoses[system] = { position: root.position.clone(), rotation: root.quaternion.clone() };
      const bounds = new THREE.Box3().setFromObject(root).translate(root.position.clone().negate());
      const workspace = new THREE.Box3(
        new THREE.Vector3(-22 - bounds.min.x, root.position.y, -11.5 - bounds.min.z),
        new THREE.Vector3(24 - bounds.max.x, 25, 9.5 - bounds.max.z));
      this.consoleMotions[system] = new DeskMotion(root.position, { bounds, workspace });
    }
    this.pearOn = true;
    this.pearBrightness = .7;
    this.updatePearLight();
    this.dsReflectionCube = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType });
    this.dsReflectionCamera = new THREE.CubeCamera(.1, 1500, this.dsReflectionCube);
    this.dsReflectionFilter = new THREE.PMREMGenerator(this.renderer);
    this.dsReflectiveMaterials = new Set();
    this.ds.root.traverse(object => {
      if (object.material?.isMeshPhysicalMaterial) this.dsReflectiveMaterials.add(object.material);
    });
    this.pressed = new Set();
    this.controlGroups = [...new Set([...this.model.controls.values()].map(({ mesh }) => mesh))]
      .filter((mesh) => mesh !== this.model.controls.get('power').mesh)
      .map((mesh) => ({ mesh, ids: [...this.model.controls].filter(([, value]) => value.mesh === mesh).map(([id]) => id) }));
    this.showPowerOff();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.zoom = 1;
    this.playZoom = .5;
    this.drag = null;
    this.inspectionPointers = new Map();
    this.pinch = null;
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.canvas.focus({ preventScroll: true });
      const hit = this.pick(event);
      if (!this.transition && hit?.object.userData.dsStylus && this.mode !== 'inspecting') {
        this.dsController?.pickUpStylus(event);
        return;
      }
      if (this.dsController?.stylusHeld && this.console === 'ds' && this.mode === 'playing') return;
      if (this.consoleMove) return;
      if (this.pearMove) {
        if (this.pearMove.pointerId === undefined && this.mode === 'table' && !this.transition) {
          const point = this.tablePoint(event);
          if (point && this.movePearTo(point)) this.finishPearMove(false);
        }
        return;
      }
      if (this.mode === 'table' && !this.transition && hit?.object.userData.pearBoy) {
        this.beginPearMove(event, hit.point);
        return;
      }
      if (!this.transition && hit?.object.userData.lampToggle) { onLamp(); return; }
      if (this.mode === 'table' && !this.transition && hit) {
        let object = hit.object;
        while (object && !object.userData.console) object = object.parent;
        if (object?.userData.console) {
          this.beginConsoleMove(object.userData.console, event, hit.point);
          return;
        }
      }
      if (this.mode === 'inspecting') {
        if (this.transition) return;
        this.inspectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.inspectionPointers.size === 1) {
          this.beginInspectionDrag(event.pointerId, event);
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
      if (this.consoleMove?.pointerId === event.pointerId) {
        const move = this.consoleMove;
        move.moved ||= Math.hypot(event.clientX - move.x, event.clientY - move.y) > 4;
        const point = this.tablePoint(event, move.plane);
        if (move.moved && point) this.moveConsoleTo(point.add(move.offset));
        return;
      }
      if (this.pearMove?.pointerId === event.pointerId) {
        const move = this.pearMove;
        move.moved ||= Math.hypot(event.clientX - move.x, event.clientY - move.y) > 4;
        const point = this.tablePoint(event);
        if (move.moved && point) this.movePearTo(point.add(move.offset));
        return;
      }
      if (this.inspectionPointers.has(event.pointerId)) {
        this.inspectionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (this.pinch && this.inspectionPointers.size === 2) {
        const [a, b] = this.inspectionPointers.values();
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 0) this.setZoom(this.pinch.zoom * this.pinch.distance / distance);
      } else if (this.drag?.id === event.pointerId) {
        if (this.console === 'ds' && this.dsInspectAction === 'hinge') {
          this.setDsHinge(this.drag.hinge - (event.clientY - this.drag.y) * .4);
        } else {
          const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (event.clientX - this.drag.x) * .008);
          const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (event.clientY - this.drag.y) * .008);
          this.activeModel.root.quaternion.copy(yaw.multiply(pitch).multiply(this.drag.rotation));
          this.reframeDsPose();
        }
      } else {
        const hit = this.pick(event);
        this.dsController?.hoverStylus(!!hit?.object.userData.dsStylus);
        this.canvas.style.cursor = this.mode === 'inspecting' || (this.mode === 'table' && hit) ?
          'grab' : hit ? 'pointer' : 'default';
      }
    });
    this.canvas.addEventListener('touchstart', event => {
      // An owned drag must not consume the next dock tap as a native gesture.
      if (this.pearMove?.pointerId !== undefined || this.consoleMove?.pointerId !== undefined) event.preventDefault();
    }, { passive: false });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.canvas.addEventListener(name, (event) => {
        if (this.consoleMove?.pointerId === event.pointerId) {
          this.finishConsoleMove(name !== 'pointerup', name === 'pointerup');
          return;
        }
        if (this.pearMove?.pointerId === event.pointerId) {
          this.finishPearMove(name !== 'pointerup', name === 'pointerup' && !this.pearMove.moved);
          return;
        }
        this.inspectionPointers.delete(event.pointerId);
        this.drag = null;
        this.pinch = null;
        if (this.inspectionPointers.size === 1) {
          const [id, point] = this.inspectionPointers.entries().next().value;
          this.beginInspectionDrag(id, { clientX: point.x, clientY: point.y });
        }
      });
    }
    this.canvas.addEventListener('wheel', (event) => {
      if (this.consoleMove) {
        event.preventDefault();
        const move = this.consoleMove, motion = this.consoleMotions[move.system];
        const offset = this.camera.getWorldDirection(new THREE.Vector3())
          .multiplyScalar(THREE.MathUtils.clamp(event.deltaY * .015, -2, 2));
        const previous = motion.position.clone();
        if (this.moveConsoleTo(previous.clone().add(offset))) {
          move.moved = true;
          move.plane.translate(motion.position.clone().sub(previous));
        }
        return;
      }
      if (this.pearMove) {
        event.preventDefault();
        const direction = this.camera.getWorldDirection(new THREE.Vector3());
        const offset = direction.multiplyScalar(THREE.MathUtils.clamp(event.deltaY * .015, -2, 2));
        const previous = this.pear.root.position.clone();
        if (this.movePearTo(this.pear.root.position.clone().add(offset))) {
          this.pearMove.plane.translate(this.pear.root.position.clone().sub(previous));
        }
        return;
      }
      if (this.mode !== 'inspecting') return;
      event.preventDefault();
      this.setZoom(this.zoom * Math.exp(event.deltaY * .001));
    }, { passive: false });
    this.canvas.addEventListener('keydown', (event) => {
      if (this.consoleMove && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const steps = {
          ArrowLeft: [-.65, 0, 0], ArrowRight: [.65, 0, 0],
          ArrowUp: [0, 0, -.65], ArrowDown: [0, 0, .65],
          PageUp: [0, .65, 0], PageDown: [0, -.65, 0],
        };
        const motion = this.consoleMotions[this.consoleMove.system];
        if (steps[event.code]) {
          event.preventDefault();
          this.consoleMove.moved = true;
          this.moveConsoleTo(motion.position.clone().add(new THREE.Vector3(...steps[event.code])));
          motion.velocity.set(0, 0, 0);
        } else if (event.code === 'Enter' || event.code === 'Escape') {
          event.preventDefault();
          this.finishConsoleMove(event.code === 'Escape');
        }
        return;
      }
      if (this.pearMove && !this.transition && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const steps = {
          ArrowLeft: [-.65, 0, 0], ArrowRight: [.65, 0, 0],
          ArrowUp: [0, 0, -.65], ArrowDown: [0, 0, .65],
          PageUp: [0, .65, 0], PageDown: [0, -.65, 0],
        };
        if (steps[event.code]) {
          event.preventDefault();
          this.movePearTo(this.pear.root.position.clone().add(new THREE.Vector3(...steps[event.code])));
          this.pearMotion.velocity.set(0, 0, 0);
        } else if (event.code === 'Enter' || event.code === 'Escape') {
          event.preventDefault();
          this.finishPearMove(event.code === 'Escape');
        }
        return;
      }
      if (this.mode !== 'inspecting' || event.ctrlKey || event.altKey || event.metaKey) return;
      const rotations = { ArrowLeft: [0, -.15], ArrowRight: [0, .15], ArrowUp: [-.15, 0], ArrowDown: [.15, 0] };
      if (rotations[event.code]) {
        event.preventDefault();
        if (this.transition || (this.console === 'ds' && this.dsGameplayPose)) return;
        const [pitch, yaw] = rotations[event.code];
        if (this.console === 'ds' && this.dsInspectAction === 'hinge') {
          this.setDsHinge(this.dsHinge + (['ArrowUp', 'ArrowRight'].includes(event.code) ? 5 : -5));
        } else {
          this.activeModel.root.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0)));
          this.reframeDsPose();
        }
      } else if (['Equal', 'NumpadAdd', 'Minus', 'NumpadSubtract', 'Home'].includes(event.code)) {
        event.preventDefault();
        if (event.code === 'Home') {
          if (this.transition || (this.console === 'ds' && this.dsGameplayPose)) return;
          this.activeModel.root.quaternion.copy(this.console === 'ds' ? dsPlayQuaternion : playQuaternion);
          if (this.console === 'ds') this.setDsHinge(180);
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
    this.cancelPearOnBlur = () => { this.finishPearMove(true); this.finishConsoleMove(true); };
    window.addEventListener('blur', this.cancelPearOnBlur);
    this.pearCursor = null;
    this.pearGaze = new THREE.Vector2();
    this.trackPearCursor = event => {
      if (event.pointerType === 'touch') return;
      this.pearCursor ??= new THREE.Vector2();
      this.pearCursor.set(event.clientX, event.clientY);
    };
    this.clearPearCursor = () => { this.pearCursor = null; };
    window.addEventListener('pointermove', this.trackPearCursor);
    document.addEventListener('pointerleave', this.clearPearCursor);
    window.addEventListener('blur', this.clearPearCursor);
    this.resize();
    this.camera.position.copy(this.cameraTarget);
    this.lookAt.copy(this.lookTarget);
    this.camera.lookAt(this.lookAt);
  }

  get activeModel() { return this.console === 'ds' ? this.ds : this.model; }

  get dsHinge() { return 180 - THREE.MathUtils.radToDeg(this.ds.lid.rotation.x); }

  beginInspectionDrag(id, event) {
    if (this.console === 'ds' && this.dsGameplayPose) { this.drag = null; return; }
    this.drag = { id, x: event.clientX, y: event.clientY,
      rotation: this.activeModel.root.quaternion.clone(), hinge: this.dsHinge };
  }

  setDsInspectAction(action) {
    if (!['body', 'hinge'].includes(action)) throw new Error('Unknown DS inspection control.');
    this.dsInspectAction = action;
    this.drag = this.pinch = null;
    this.inspectionPointers.clear();
  }

  setDsHinge(degrees) {
    if (!Number.isFinite(degrees)) throw new Error('Invalid DS hinge opening.');
    if (this.console !== 'ds' || this.mode !== 'inspecting' || this.transition || this.dsGameplayPose) return;
    this.ds.lid.rotation.x = THREE.MathUtils.degToRad(180 - THREE.MathUtils.clamp(degrees, 30, 180));
    this.reframeDsPose();
    this.host.dispatchEvent(new CustomEvent('ds-pose-change'));
  }

  setDsPoseLocked(locked) {
    if (typeof locked !== 'boolean') throw new Error('Invalid DS orientation lock.');
    if (this.console !== 'ds' || this.mode !== 'inspecting' || this.transition) return;
    this.dsGameplayPose = locked ? { rotation: this.ds.root.quaternion.clone(), hinge: this.ds.lid.rotation.x } : null;
    this.drag = this.pinch = null;
    this.inspectionPointers.clear();
    this.host.dispatchEvent(new CustomEvent('ds-pose-change'));
  }

  reframeDsPose() {
    if (this.console !== 'ds' || this.mode !== 'inspecting' || this.transition) return;
    this.changed = this.dsReflectionsDirty = true;
    this.updateCameraTargets();
    this.ds.root.position.copy(this.playTarget);
    this.camera.position.copy(this.cameraTarget);
    this.lookAt.copy(this.lookTarget);
    this.updateViewMatrices();
  }

  updateViewMatrices() {
    // Projection and touch rays must not depend on the next eligible GPU paint.
    this.camera.lookAt(this.lookAt);
    this.camera.updateWorldMatrix(true, false);
    this.activeModel.root.updateWorldMatrix(true, true);
    this.dsController?.projectControls();
  }

  dsPoseBounds(rotation, hinge) {
    this.ds.root.updateWorldMatrix(true, true);
    const rootMatrix = new THREE.Matrix4().compose(dsPlayPosition, rotation, this.ds.root.scale);
    const rootDelta = rootMatrix.clone().multiply(this.ds.root.matrixWorld.clone().invert());
    const lidMatrix = new THREE.Matrix4().compose(this.ds.lid.position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(hinge, 0, 0)), this.ds.lid.scale);
    const lidDelta = rootMatrix.clone().multiply(lidMatrix).multiply(this.ds.lid.matrixWorld.clone().invert());
    const bounds = new THREE.Box3();
    this.ds.root.traverse(object => {
      if (!object.geometry) return;
      let parent = object;
      while (parent !== this.ds.root && parent !== this.ds.lid) parent = parent.parent;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const matrix = (parent === this.ds.lid ? lidDelta : rootDelta).clone().multiply(object.matrixWorld);
      bounds.union(object.geometry.boundingBox.clone().applyMatrix4(matrix));
    });
    return bounds;
  }

  selectConsole(system) {
    this.finishPearMove(true);
    this.finishConsoleMove(true);
    if (!['gba', 'ds'].includes(system)) throw new Error('Unknown console.');
    if (system === this.console) { this.setView('playing'); return; }
    this.activeModel.root.position.copy(this.consolePoses[this.console].position);
    this.activeModel.root.quaternion.copy(this.consolePoses[this.console].rotation);
    if (this.console === 'ds') this.ds.lid.rotation.x = dsTableHinge;
    this.transition = this.cameraMotion = null;
    this.console = system;
    this.host.dataset.console = system;
    this.mode = 'table';
    this.setView('playing');
  }

  setScreenFullscreen(focused) {
    if (!focused) {
      this.lastRender = null;
      this.nextPaint = 0;
      this.renderedLastFrame = false;
      this.changed = true;
    }
    this.renderer.setAnimationLoop(focused ? null : (time) => this.render(time));
  }

  pick(event) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects([this.model.root, this.ds.root, this.lamp.root, this.pear.root], true)
      .find(hit => hit.object !== this.pear.root.getObjectByName('pear-boy soft contact shadow') &&
        !(this.dsController?.stylusHeld && hit.object.userData.dsStylus));
  }

  tablePoint(event, plane = this.pearMove?.plane ?? new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());
  }

  updatePearLight() {
    for (const light of this.pear.lights) {
      light.visible = this.pearOn;
      light.intensity = 800 * this.pearBrightness;
    }
    this.pear.body.material.emissiveIntensity = this.pearOn ? 110 * this.pearBrightness : 0;
    this.changed = this.dsReflectionsDirty = true;
    this.host.dispatchEvent(new CustomEvent('pear-change'));
  }

  setPearEnabled(enabled) {
    if (typeof enabled !== 'boolean') throw new Error('Invalid pear-boy power state.');
    this.pearOn = enabled;
    this.updatePearLight();
  }

  setPearBrightness(value) {
    if (!Number.isFinite(value) || value < .1 || value > 1) throw new Error('pear-boy brightness must be between 10% and 100%.');
    this.pearBrightness = value;
    this.updatePearLight();
  }

  beginPearMove(event, hitPoint) {
    if (this.pearMove) return;
    this.setView('table');
    const origin = this.pear.root.position.clone();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      this.camera.getWorldDirection(new THREE.Vector3()), hitPoint ?? origin.clone().add(new THREE.Vector3(0, 4, 0)));
    const point = event ? this.tablePoint(event, plane) : null;
    this.pearMove = {
      origin, pointerId: event?.pointerId, x: event?.clientX, y: event?.clientY, moved: false,
      offset: point ? origin.clone().sub(point) : new THREE.Vector3(), plane,
    };
    this.pearMotion.pickUp();
    this.pear.setFaceLifted(true);
    this.updatePearContact();
    this.canvas.style.cursor = 'grabbing';
    if (event) this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus({ preventScroll: true });
    this.changed = true;
    this.host.dispatchEvent(new CustomEvent('pear-change'));
  }

  beginConsoleMove(system, event, hitPoint) {
    if (!this.consoleMotions[system]) throw new Error('Unknown console.');
    if (this.mode !== 'table' || this.transition || this.consoleMove) return;
    this.finishPearMove(true);
    const motion = this.consoleMotions[system], origin = motion.position.clone();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      this.camera.getWorldDirection(new THREE.Vector3()), hitPoint ?? origin);
    const point = event ? this.tablePoint(event, plane) : null;
    this.consoleMove = {
      system, origin,
      pointerId: event?.pointerId, x: event?.clientX, y: event?.clientY, moved: false,
      plane, offset: point ? origin.clone().sub(point) : new THREE.Vector3(),
    };
    motion.pickUp();
    if (event) this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
    this.canvas.focus({ preventScroll: true });
    this.host.dispatchEvent(new CustomEvent('console-move-change'));
  }

  consoleObstacles(system) {
    const other = system === 'gba' ? this.ds.root : this.model.root;
    return [other, this.lamp.root, ...this.deskObjects].map(object => new THREE.Box3().setFromObject(object))
      .concat(this.pear.bounds.clone().translate(this.pear.root.position));
  }

  moveConsoleTo(point) {
    const move = this.consoleMove;
    if (!move) return false;
    const motion = this.consoleMotions[move.system];
    const position = point.clone().clamp(motion.workspace.min, motion.workspace.max);
    const candidate = motion.bounds.clone().translate(position).expandByScalar(.04);
    const occupied = this.consoleObstacles(move.system).some(box => candidate.intersectsBox(box));
    this.host.dataset.consolePlacement = occupied ? 'blocked' : 'clear';
    if (!occupied) {
      motion.moveTo(position, performance.now());
      this.consolePoses[move.system].position.copy(position);
      this.changed = true;
    } else motion.velocity.set(0, 0, 0);
    this.host.dispatchEvent(new CustomEvent('console-move-change'));
    return !occupied;
  }

  finishConsoleMove(cancelled = false, activate = false) {
    const move = this.consoleMove;
    if (!move) return;
    this.consoleMove = null;
    const motion = this.consoleMotions[move.system];
    if (cancelled || (activate && !move.moved)) motion.reset(move.origin);
    else motion.drop(performance.now());
    this.consolePoses[move.system].position.copy(motion.position);
    delete this.host.dataset.consolePlacement;
    if (move.pointerId !== undefined && this.canvas.hasPointerCapture(move.pointerId)) this.canvas.releasePointerCapture(move.pointerId);
    this.canvas.style.cursor = 'default';
    this.changed = this.dsReflectionsDirty = true;
    this.host.dispatchEvent(new CustomEvent('console-move-change'));
    if (!cancelled && activate && !move.moved) {
      if (move.system === this.console) this.setView('playing');
      else this.onConsole?.(move.system);
    }
  }

  resetConsolePositions() {
    this.finishConsoleMove(true);
    if (this.mode !== 'table' || this.transition) return;
    const pearBounds = this.pear.bounds.clone().translate(this.pear.root.position);
    if (['gba', 'ds'].some(system =>
      this.consoleMotions[system].bounds.clone().translate(this.consoleHomes[system]).intersectsBox(pearBounds))) {
      throw new Error('The original console positions are occupied by pear-boy. Move him before resetting the consoles.');
    }
    for (const system of ['gba', 'ds']) {
      this.consoleMotions[system].reset(this.consoleHomes[system]);
      this.consolePoses[system].position.copy(this.consoleHomes[system]);
    }
    this.changed = this.dsReflectionsDirty = true;
    this.host.dispatchEvent(new CustomEvent('console-move-change'));
  }

  movePearTo(point) {
    const position = new THREE.Vector3(THREE.MathUtils.clamp(point.x, -22, 24), THREE.MathUtils.clamp(point.y, 0, 25),
      THREE.MathUtils.clamp(point.z, -11.5, 7.5));
    const candidate = this.pear.bounds.clone().translate(position);
    const occupied = this.pearObstacles().some(bounds =>
      candidate.max.x + .25 > bounds.min.x && candidate.min.x - .25 < bounds.max.x &&
      candidate.max.z + .25 > bounds.min.z && candidate.min.z - .25 < bounds.max.z &&
      candidate.max.y > bounds.min.y && position.y < bounds.max.y + .25);
    this.host.dataset.pearPlacement = occupied ? 'blocked' : 'clear';
    if (!occupied) {
      this.pearMotion.moveTo(position, performance.now());
      this.updatePearContact();
      this.changed = true;
    }
    this.host.dispatchEvent(new CustomEvent('pear-change'));
    return !occupied;
  }

  finishPearMove(cancelled = false, toggle = false) {
    const move = this.pearMove;
    if (!move) return;
    this.pearMove = null;
    if (cancelled) {
      this.pearMotion.reset(move.origin);
      this.pear.resetLimbs();
    } else {
      this.pearMotion.drop(performance.now());
    }
    this.pear.setFaceLifted(!this.pearMotion.sleeping);
    this.updatePearContact();
    delete this.host.dataset.pearPlacement;
    if (move.pointerId !== undefined && this.canvas.hasPointerCapture(move.pointerId)) this.canvas.releasePointerCapture(move.pointerId);
    this.canvas.style.cursor = 'default';
    this.changed = this.dsReflectionsDirty = true;
    if (toggle && !cancelled) this.setPearEnabled(!this.pearOn);
    this.host.dispatchEvent(new CustomEvent('pear-change'));
  }

  resetPearPosition() {
    this.finishPearMove(true);
    this.pearMotion.reset(pearHome);
    this.pear.setFaceLifted(false);
    this.pear.resetLimbs();
    this.updatePearContact();
    this.changed = this.dsReflectionsDirty = true;
  }

  pearObstacles() {
    return [this.model.root, this.ds.root, this.lamp.root, ...this.deskObjects]
      .map(object => new THREE.Box3().setFromObject(object));
  }

  updatePearContact() {
    const height = this.pear.root.position.y;
    this.pear.contact.position.y = .012 - height;
    this.pear.contact.material.opacity = Math.max(.12, 1 - height / 20);
    this.pear.contact.scale.setScalar(1 + height * .04);
  }

  resize() {
    this.finishPearMove(true);
    this.finishConsoleMove(true);
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.changed = true;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateCameraTargets();
    if (this.transition && this.mode !== 'table') this.transition.targetPosition = this.playTarget;
    if (!this.transition) {
      this.cameraMotion = null;
      this.camera.position.copy(this.cameraTarget);
      this.lookAt.copy(this.lookTarget);
      if (this.mode === 'playing') this.activeModel.root.position.copy(this.playTarget);
    }
    this.updateViewMatrices();
  }

  updateCameraTargets() {
    if (this.mode === 'table') {
      const scale = Math.max(1, 1.3 / this.camera.aspect);
      this.cameraTarget = new THREE.Vector3(2, 27, 42).multiplyScalar(scale);
      this.lookTarget = new THREE.Vector3(4.2, 4, -1.5);
    } else if (this.console === 'ds') {
      const tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const rotation = this.transition?.targetRotation ??
        (this.mode === 'playing' ? this.dsGameplayPose?.rotation ?? dsPlayQuaternion : this.ds.root.quaternion);
      const hinge = this.transition?.targetHinge ??
        (this.mode === 'playing' ? this.dsGameplayPose?.hinge ?? 0 : this.ds.lid.rotation.x);
      const bounds = this.dsPoseBounds(rotation, hinge);
      this.playTarget = dsPlayPosition.clone();
      const lift = Math.max(0, 2 - bounds.min.y);
      this.playTarget.y += lift;
      bounds.translate(new THREE.Vector3(0, lift, 0));
      const size = bounds.getSize(new THREE.Vector3());
      const phoneInspect = this.width < 600 && this.mode === 'inspecting';
      const top = phoneInspect ? 260 : 90, bottom = this.width < 600 ? 140 : 120;
      const distance = (Math.max(Math.max(12, size.x + 1.2) / this.camera.aspect, (size.y + .8) *
        this.height / Math.max(160, this.height - top - bottom)) / (2 * tangent) + size.z / 2) *
        this.zoom / (this.mode === 'playing' ? this.playZoom * 2 : 1);
      this.lookTarget = bounds.getCenter(new THREE.Vector3());
      this.lookTarget.y += (top - bottom) * tangent * distance / this.height;
      this.cameraTarget = this.lookTarget.clone().add(new THREE.Vector3(0, 0, distance));
    } else {
      const tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const padding = 180;
      const inserting = this.mode === 'playing' && !!this.cartridgeMotion;
      const closePlay = this.mode === 'playing' && !inserting;
      const lift = inserting ? 1.05 : 0;
      this.playTarget = playPosition.clone().add(new THREE.Vector3(0, inserting ? -.86 : 0, 0));
      const envelope = inserting ? 8.3 : closePlay ? 5.35 : 5.55;
      const envelopeWidth = closePlay ? 9.8 : 10.2;
      const ordinaryDistance = Math.max(envelopeWidth / this.camera.aspect, envelope *
        this.height / Math.max(160, this.height - padding)) / (2 * tangent);
      const distance = ordinaryDistance * this.zoom / (this.mode === 'playing' ? this.playZoom * 2 : 1);
      const framingOffset = closePlay ? -.12 : 0;
      this.cameraTarget = new THREE.Vector3(0, this.playTarget.y + .1 + lift + framingOffset, distance);
      this.lookTarget = this.playTarget.clone().add(new THREE.Vector3(0, lift + framingOffset, 0));
    }
  }

  insertCartridge(id, animate = true) {
    if (this.cartridgeId === id) return;
    this.cartridgeId = id;
    this.model.cartridge.visible = true;
    const moving = animate && !this.reducedMotion.matches;
    this.model.cartridge.position.y = moving ? 3.8 : 1.52;
    this.cartridgeMotion = moving ? { elapsed: 0, lastPaint: null } : null;
    this.host.dataset.cartridge = moving ? 'inserting' : 'seated';
    this.changed = true;
    this.reframeCartridge();
  }

  reframeCartridge() {
    if (this.mode !== 'playing' || this.console !== 'gba') return;
    this.updateCameraTargets();
    if (this.transition) this.transition.targetPosition = this.playTarget;
    this.cameraMotion = {
      started: performance.now(), camera: this.camera.position.clone(), look: this.lookAt.clone(),
      position: this.model.root.position.clone(), targetPosition: this.playTarget.clone(),
    };
  }

  setZoom(value) {
    this.zoom = THREE.MathUtils.clamp(value, .65, 1.65);
    this.updateCameraTargets();
    this.camera.position.copy(this.cameraTarget);
    if (this.console === 'ds') this.lookAt.copy(this.lookTarget);
    this.updateViewMatrices();
  }

  setPlayZoom(value) {
    this.playZoom = THREE.MathUtils.clamp(value, .5, 1);
    if (this.mode !== 'playing') return;
    this.updateCameraTargets();
    if (!this.transition && !this.cameraMotion) {
      this.camera.position.copy(this.cameraTarget);
      if (this.console === 'ds') this.lookAt.copy(this.lookTarget);
      this.updateViewMatrices();
    }
    this.changed = true;
  }

  setView(mode) {
    this.finishPearMove(true);
    this.finishConsoleMove(true);
    if (!['table', 'playing', 'inspecting'].includes(mode)) throw new Error('Unknown handheld view.');
    if (mode === this.mode && !this.transition) return;
    this.changed = true;
    this.drag = null;
    this.inspectionPointers.clear();
    this.pinch = null;
    const deskTransition = this.console === 'ds' && (mode === 'table' || this.mode === 'table');
    this.mode = mode;
    this.dsReflectionsDirty = true;
    this.cameraMotion = null;
    this.zoom = 1;
    this.transition = {
      started: performance.now(), elapsed: 0, lastPaint: null, duration: this.reducedMotion.matches ? 0 : 850,
      deskTransition,
      position: this.activeModel.root.position.clone(), rotation: this.activeModel.root.quaternion.clone(),
      camera: this.camera.position.clone(), look: this.lookAt.clone(),
      targetRotation: mode === 'table' ? this.consolePoses[this.console].rotation :
        (this.console === 'ds' ? (mode === 'inspecting' ? this.ds.root.quaternion.clone() :
          this.dsGameplayPose?.rotation ?? dsPlayQuaternion) : playQuaternion),
      hinge: this.ds.lid.rotation.x,
      targetHinge: mode === 'table' ? dsTableHinge : mode === 'inspecting' ? this.ds.lid.rotation.x :
        this.dsGameplayPose?.hinge ?? 0,
    };
    this.updateCameraTargets();
    this.transition.targetPosition = mode === 'table' ? this.consolePoses[this.console].position.clone() : this.playTarget;
    this.host.dataset.view = 'moving';
    this.onView(mode, true);
    this.canvas.focus({ preventScroll: true });
  }

  setPower(running) {
    this.model.led.material.color.set(running ? '#186f32' : '#24382b');
    this.model.led.material.emissive.set(running ? '#00b800' : '#000000');
    this.model.led.material.emissiveIntensity = running ? 80 * .018 / this.renderer.toneMappingExposure : 0;
    const power = this.model.controls.get('power').mesh;
    const x = running ? .1 : -.1;
    if (power.position.x !== x) this.changed = true;
    power.position.x = x;
  }

  setLamp(enabled) {
    this.dsReflectionsDirty = true;
    this.changed = true;
    this.lampOn = enabled;
    this.lamp.light.visible = enabled;
    this.lamp.diffuse.visible = enabled;
    this.lamp.underShade.visible = enabled;
    this.lamp.bounce.visible = enabled;
    this.lamp.diffuser.material.emissiveIntensity = enabled ? 80 : 0;
    this.lamp.shade.material.emissiveIntensity = enabled ? 60 : 0;
  }

  setRoomLights(enabled) {
    this.dsReflectionsDirty = true;
    this.changed = true;
    this.roomLightsOn = enabled;
    this.roomLighting.visible = enabled;
    this.scene.background.set(enabled ? '#201a16' : '#000000');
  }

  updateDsReflections() {
    const models = [this.model.root, this.ds.root];
    const visibility = models.map(model => model.visible);
    const toneMapping = this.renderer.toneMapping;
    try {
      for (const model of models) model.visible = false;
      this.ds.root.getWorldPosition(this.dsReflectionCamera.position);
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.shadowMap.needsUpdate = true;
      this.dsReflectionCamera.update(this.renderer, this.scene);
      const reflection = this.dsReflectionFilter.fromCubemap(this.dsReflectionCube.texture);
      for (const material of this.dsReflectiveMaterials) {
        material.envMap = reflection.texture;
        material.needsUpdate = true;
      }
      this.dsReflection?.dispose();
      this.dsReflection = reflection;
      this.dsReflectionsDirty = false;
    } finally {
      for (const [index, model] of models.entries()) model.visible = visibility[index];
      this.renderer.toneMapping = toneMapping;
      this.renderer.shadowMap.needsUpdate = true;
    }
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

  setScreenCurve(curved) {
    if (this.screenCurved === curved) return;
    const geometries = createLcdGeometries(curved);
    for (const name of ['screen', 'recess']) {
      this.model[name].geometry.dispose();
      this.model[name].geometry = geometries[name];
    }
    this.screenCurved = curved;
    this.changed = true;
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
      context.fillStyle = '#100a20';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#c9b4ec';
      context.textAlign = 'center';
      context.drawImage(brandImage, 38, 90, width - 76, (width - 76) * brandImage.height / brandImage.width);
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

  fenceRoomPaint() {
    if (!this.paintSyncAvailable) return;
    const gl = this.renderer.getContext();
    this.paintFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (this.paintFence) gl.flush();
    else if (!gl.isContextLost()) this.failRoomPaint();
  }

  failRoomPaint() {
    if (!this.paintSyncFailed) {
      this.paintSyncFailed = true;
      this.onError(new Error('Room GPU synchronization failed. The game is retained; reload to retry rendering.'));
    }
  }

  render(time) {
    if (document.fullscreenElement?.id === 'screen-focus') {
      this.lastRender = time;
      this.renderedLastFrame = false;
      return;
    }
    const gl = this.renderer.getContext();
    if (gl.isContextLost()) {
      this.paintFence = null;
      this.lastRender = time;
      this.dsController?.paintScreens();
      return;
    }
    const delta = Math.max(0, (time - (this.lastRender ?? time - 16.67)) / 1000);
    this.lastRender = time;
    if (this.paintFence) {
      const status = gl.clientWaitSync(this.paintFence, 0, 0);
      if (status !== gl.TIMEOUT_EXPIRED) {
        gl.deleteSync(this.paintFence);
        this.paintFence = null;
        if (status === gl.WAIT_FAILED) {
          this.failRoomPaint();
        } else {
          const elapsed = Math.max(0, time - this.paintSubmitted);
          const recoveryLimit = this.mode === 'playing' && !this.transition && !this.cartridgeMotion ? 1000 : 200;
          // Moderate frames need no extra idle; severe stalls still need native-runtime headroom.
          this.nextPaint = time + (elapsed > 100 ? Math.min(recoveryLimit, elapsed * 2) : 0);
        }
      }
    } else if (this.renderedLastFrame) {
      const recoveryLimit = this.mode === 'playing' && !this.transition && !this.cartridgeMotion ? 1000 : 200;
      this.nextPaint = time + (delta > .05 ? Math.min(recoveryLimit, delta * 2000) : 0);
    }
    this.renderedLastFrame = false;
    const paintDue = !this.paintFence && !this.paintSyncFailed && time >= (this.nextPaint ?? 0) &&
      !this.nativeBusy && !document.querySelector('dialog[open]');
    const cartridgeMotion = this.cartridgeMotion;
    const cartridgeElapsed = cartridgeMotion ? nextCartridgeElapsed(cartridgeMotion, time, paintDue) : 0;
    const transition = this.transition;
    const transitionElapsed = transition ? nextTransitionElapsed(transition, time, paintDue) : 0;
    const exposure = this.lampOn || this.roomLightsOn || this.pearOn ? .018 : .45;
    this.renderer.toneMappingExposure = THREE.MathUtils.damp(
      this.renderer.toneMappingExposure, exposure, 4, delta);
    const adapting = Math.abs(this.renderer.toneMappingExposure - exposure) > .00001;
    if (!adapting) this.renderer.toneMappingExposure = exposure;
    // Keep dark-room exposure adaptation from bleaching the green indicator.
    if (this.model.led.material.emissiveIntensity > 0) {
      this.model.led.material.emissiveIntensity = 80 * .018 / this.renderer.toneMappingExposure;
    }
    if (this.cartridgeMotion) {
      const fraction = THREE.MathUtils.clamp(
        (cartridgeElapsed - cartridgeFramingDuration) / cartridgeSlideDuration, 0, 1);
      const ease = fraction * fraction * (3 - 2 * fraction);
      const y = THREE.MathUtils.lerp(3.8, 1.52, ease);
      this.changed ||= this.model.cartridge.position.y !== y;
      this.model.cartridge.position.y = y;
    }
    if (transition) {
      const fraction = transition.duration ? transitionElapsed / transition.duration : 1;
      const ease = fraction * fraction * (3 - 2 * fraction);
      this.activeModel.root.position.lerpVectors(transition.position, transition.targetPosition, ease);
      if (transition.deskTransition) {
        const sideways = this.mode === 'table' ? 1 - THREE.MathUtils.smoothstep(1 - ease, .2, 1) :
          THREE.MathUtils.smoothstep(ease, .2, 1);
        this.ds.root.position.x = THREE.MathUtils.lerp(transition.position.x, transition.targetPosition.x, sideways);
        this.ds.root.position.y += Math.sin(Math.PI * ease) * 3.5;
      }
      this.activeModel.root.quaternion.slerpQuaternions(transition.rotation, transition.targetRotation, ease);
      if (this.console === 'ds') this.ds.lid.rotation.x = THREE.MathUtils.lerp(transition.hinge, transition.targetHinge, ease);
      this.camera.position.lerpVectors(transition.camera, this.cameraTarget, ease);
      this.lookAt.lerpVectors(transition.look, this.lookTarget, ease);
      if (fraction === 1) {
        this.activeModel.root.position.copy(transition.targetPosition);
        this.activeModel.root.quaternion.copy(transition.targetRotation);
      }
      this.changed = true;
    } else {
      this.host.dataset.view = this.mode;
      if (this.cameraMotion) {
        const elapsed = this.cartridgeMotion ? cartridgeElapsed : time - this.cameraMotion.started;
        const fraction = this.reducedMotion.matches ? 1 : Math.min(1, elapsed / cartridgeFramingDuration);
        const ease = fraction * fraction * (3 - 2 * fraction);
        this.camera.position.lerpVectors(this.cameraMotion.camera, this.cameraTarget, ease);
        this.lookAt.lerpVectors(this.cameraMotion.look, this.lookTarget, ease);
        this.model.root.position.lerpVectors(this.cameraMotion.position, this.cameraMotion.targetPosition, ease);
        if (fraction === 1) this.cameraMotion = null;
      }
    }
    this.camera.lookAt(this.lookAt);
    this.camera.updateWorldMatrix(true, false);
    let buttonsMoving = false;
    for (const { mesh, ids } of this.controlGroups) {
      const motion = mesh.userData.motion;
      const target = ids.some((id) => this.pressed.has(id)) ? 1 : 0;
      const response = target ? 50 : 80;
      const previous = motion.press;
      motion.press = THREE.MathUtils.damp(motion.press, target, response, delta);
      if (Math.abs(motion.press - target) < .00001) motion.press = target;
      buttonsMoving ||= motion.press !== previous;
      mesh.position.copy(motion.restPosition).addScaledVector(motion.travel, motion.press);
      if (ids.includes('up')) {
        const x = Number(this.pressed.has('down')) - Number(this.pressed.has('up'));
        const y = Number(this.pressed.has('right')) - Number(this.pressed.has('left'));
        const pitch = motion.pitch, yaw = motion.yaw;
        motion.pitch = THREE.MathUtils.damp(motion.pitch, x * .1, response, delta);
        motion.yaw = THREE.MathUtils.damp(motion.yaw, y * .1, response, delta);
        if (Math.abs(motion.pitch - x * .1) < .00001) motion.pitch = x * .1;
        if (Math.abs(motion.yaw - y * .1) < .00001) motion.yaw = y * .1;
        buttonsMoving ||= motion.pitch !== pitch || motion.yaw !== yaw;
        mesh.rotation.set(motion.pitch, motion.yaw, 0);
      } else {
        mesh.quaternion.copy(motion.restQuaternion);
        if (ids.includes('l') || ids.includes('r')) mesh.rotateX(-motion.press * .075);
      }
    }
    let consolesMoving = false;
    for (const system of ['gba', 'ds']) {
      if ((system === this.console && this.mode !== 'table') || this.transition) continue;
      const motion = this.consoleMotions[system];
      if (motion.update(delta, motion.held || motion.sleeping ? [] : this.consoleObstacles(system))) {
        this.consolePoses[system].position.copy(motion.position);
        consolesMoving = true;
        if (motion.sleeping) this.dsReflectionsDirty = true;
      }
    }
    const bodyMoving = this.pearMotion.update(delta,
      this.pearMotion.held || this.pearMotion.sleeping ? [] : this.pearObstacles());
    if (bodyMoving) {
      this.updatePearContact();
      if (this.pearMotion.sleeping) this.dsReflectionsDirty = true;
    }
    const frightened = !!this.pearMove || !this.pearMotion.sleeping;
    if (this.pear.face.lifted !== frightened) this.pear.setFaceLifted(frightened);
    const limbsMoving = this.pear.updateLimbs(delta, this.reducedMotion.matches);
    this.pearGaze.set(0, 0);
    if (this.pearCursor) {
      const bounds = this.canvas.getBoundingClientRect();
      const facePoint = this.project(this.pear.face.anchor);
      this.pearGaze.set(
        THREE.MathUtils.clamp((this.pearCursor.x - bounds.left - facePoint.x) / (this.width * .2), -1, 1),
        THREE.MathUtils.clamp((facePoint.y - this.pearCursor.y + bounds.top) / (this.height * .2), -1, 1));
    }
    const faceMoving = this.pear.updateFace(delta, this.pearGaze, this.reducedMotion.matches);
    this.changed ||= buttonsMoving || bodyMoving || limbsMoving || faceMoving || consolesMoving;
    this.dsController?.paintStylus();
    this.dsController?.paintScreens();
    // Recovery and modal tools leave the native core running without room paints.
    if (!paintDue) return;
    if (this.source) this.model.screen.material.map.needsUpdate = true;
    this.dsController?.paint(time);
    const lightDelta = Math.max(0, (time - (this.lastPaint ?? time - 16.67)) / 1000);
    if (!this.screenIllumination.failed) {
      try { this.screenIllumination.update(this.source ?? this.model.screen.material.map?.image, time, lightDelta, !!this.source); }
      catch (error) {
        this.screenIllumination.clear();
        this.screenIllumination.failed = true;
        this.onError(new Error(`LCD light sampling failed: ${error.message}. The game is retained; reload to retry lighting.`));
      }
    }
    for (const [index, illumination] of this.dsScreenIllumination.entries()) {
      if (illumination.failed) continue;
      const source = this.dsController?.powered ? this.ds.screens[index].material.map?.image : null;
      if (!source) {
        illumination.clear();
        illumination.light.visible = illumination.controlSpill.visible = false;
        continue;
      }
      illumination.light.visible = illumination.controlSpill.visible = true;
      try { illumination.update(source, time, lightDelta, !!this.dsController.source); }
      catch (error) {
        illumination.clear();
        illumination.failed = true;
        this.onError(new Error(`DS LCD ${index + 1} light sampling failed: ${error.message}. The game is retained; reload to retry lighting.`));
      }
    }
    const activeRoot = this.activeModel.root;
    const poseChanged = this.lastModel !== activeRoot || !this.lastPosition?.equals(activeRoot.position) ||
      !this.lastRotation?.equals(activeRoot.quaternion) || !this.lastCamera?.equals(this.camera.position);
    if (!this.source && !this.dsController?.running && !this.dsController?.inserting && !this.cartridgeMotion && !this.changed && !this.dsReflectionsDirty && !poseChanged && !buttonsMoving &&
        !adapting && this.screenIllumination.settled && this.dsScreenIllumination.every(light => light.settled)) return;
    this.renderer.shadowMap.needsUpdate ||= !!this.changed || poseChanged || buttonsMoving;
    // Sample the actual room once per settled pose/light change, only for DS paint.
    if (this.dsReflectionsDirty && !this.transition && !this.drag && !this.pinch && !this.pearMove && !this.consoleMove &&
        !consolesMoving && this.pearMotion.sleeping) this.updateDsReflections();
    this.renderer.render(this.scene, this.camera);
    // Canvas light readbacks can drain the entire GPU queue. Wait without blocking
    // before sampling or submitting another room frame; native LCD copies stay live.
    this.fenceRoomPaint();
    this.paintSubmitted = time;
    if (transition) {
      transition.elapsed = transitionElapsed;
      transition.lastPaint = time;
      if (transitionElapsed === transition.duration) {
        this.transition = null;
        this.host.dataset.view = this.mode;
        this.onView(this.mode, false);
      }
    }
    if (cartridgeMotion) {
      cartridgeMotion.elapsed = cartridgeElapsed;
      cartridgeMotion.lastPaint = time;
      if (cartridgeElapsed === cartridgeFramingDuration + cartridgeSlideDuration) {
        this.cartridgeMotion = null;
        this.host.dataset.cartridge = 'seated';
        this.reframeCartridge();
      }
    }
    this.lastPaint = time;
    this.renderedLastFrame = true;
    this.lastModel = activeRoot;
    this.lastPosition = activeRoot.position.clone();
    this.lastRotation = activeRoot.quaternion.clone();
    this.lastCamera = this.camera.position.clone();
    this.changed = false;
    for (const [id, control] of this.model.controls) {
      const button = id === 'power' ? document.getElementById('hardware-power') : document.querySelector(`[data-control="${id}"]`);
      if (!button) continue;
      button.hidden = this.console !== 'gba' || this.mode !== 'playing' || !!this.transition;
      if (button.hidden) continue;
      const point = this.project(control.anchor);
      const distance = this.camera.position.distanceTo(control.anchor.getWorldPosition(new THREE.Vector3()));
      const scale = this.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance);
      button.style.left = `${point.x}px`;
      button.style.top = `${point.y}px`;
      const minimum = id === 'power' ? 44 : 14;
      button.style.width = `${Math.max(minimum, control.width * scale)}px`;
      button.style.height = `${Math.max(minimum, control.height * scale)}px`;
    }
    this.dsController?.projectControls();
  }

  dispose() {
    window.removeEventListener('blur', this.cancelPearOnBlur);
    window.removeEventListener('pointermove', this.trackPearCursor);
    document.removeEventListener('pointerleave', this.clearPearCursor);
    window.removeEventListener('blur', this.clearPearCursor);
    this.renderer.setAnimationLoop(null);
    this.canvas.removeEventListener('webglcontextrestored', this.restoreRoomGpu);
    if (this.paintFence) this.renderer.getContext().deleteSync(this.paintFence);
    this.observer.disconnect();
    this.dsReflection?.dispose();
    this.dsReflectionCube.dispose();
    this.dsReflectionFilter.dispose();
    for (const material of this.dsReflectiveMaterials) material.bumpMap?.dispose();
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material) { material.map?.dispose(); material.dispose(); }
      }
    });
    this.renderer.dispose();
  }
}
