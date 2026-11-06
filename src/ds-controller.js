import * as THREE from 'three';
import { DS_CONTROLS, decodeDsBackup, dsScreenRegions, dsTouchFromUv, encodeDsBackup, identifyDsRom } from './ds-cartridge.js';
import { defaultPreferences } from './preferences.js';
import { bindKeyboard } from './keyboard.js';
import { canvasTexture } from './handheld.js';
import { DsSaveStore } from './ds-store.js';

const $ = id => document.getElementById(id);

export class DsController {
  constructor(view, { selectConsole, onState }) {
    this.view = view;
    this.model = view.ds;
    this.selectConsole = selectConsole;
    this.onState = onState;
    this.running = this.busy = this.powered = this.paused = false;
    this.store = new DsSaveStore();
    this.pending = new Map();
    this.pointers = new Map();
    this.pressed = new Set();
    this.keyboard = bindKeyboard(window, {
      enabled: event => this.inputAllowed() && !event.target.closest?.('button,input,select,textarea,[contenteditable="true"]'),
      getBindings: () => Object.fromEntries(DS_CONTROLS.map(({ id, code }) => [id, code])),
      onInput: (action, pressed, code) => this.input(action, pressed, `ds-key:${code}`),
      onMenu: () => {
        if (view.console !== 'ds' || $('ds-tools').open || document.querySelector('dialog[open]')) return false;
        this.openTools(); return true;
      },
    });
    for (const control of DS_CONTROLS) {
      const button = document.createElement('button');
      button.dataset.dsControl = control.id;
      button.setAttribute('aria-label', `DS ${control.label}`);
      button.title = `DS ${control.label} (${control.code.replace('Key', '')})`;
      button.hidden = true;
      button.addEventListener('pointerdown', event => {
        if (!this.inputAllowed() || event.button !== 0) return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        const source = `ds-pointer:${event.pointerId}`;
        this.pointers.set(event.pointerId, { action: control.id, source });
        this.input(control.id, true, source);
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => {
        const held = this.pointers.get(event.pointerId);
        if (held) { this.input(held.action, false, held.source); this.pointers.delete(event.pointerId); }
      });
      button.addEventListener('click', event => {
        if (event.detail || !this.inputAllowed()) return;
        const source = `ds-click:${crypto.randomUUID()}`;
        this.input(control.id, true, source);
        setTimeout(() => this.input(control.id, false, source), 100);
      });
      $('hardware-targets').append(button);
    }
    this.stylusDown = event => {
      if (!this.inputAllowed() || event.button !== 0 || this.touchPointer !== undefined) return;
      const point = this.touchAt(event);
      if (!point) return;
      event.preventDefault();
      this.touchPointer = event.pointerId;
      this.lastTouch = point;
      view.canvas.setPointerCapture(event.pointerId);
      this.touch(point, true);
    };
    view.canvas.addEventListener('pointerdown', this.stylusDown);
    view.canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== this.touchPointer) return;
      const point = this.touchAt(event);
      if (!point) { this.releaseTouch(); return; }
      this.lastTouch = point;
      this.touch(point, true);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) view.canvas.addEventListener(name, event => {
      if (event.pointerId === this.touchPointer) this.releaseTouch();
    });
    window.addEventListener('blur', () => this.releaseInputs());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.releaseInputs();
    });
    window.addEventListener('beforeunload', event => {
      if (this.running) { event.preventDefault(); event.returnValue = ''; }
    });
    window.addEventListener('message', event => this.message(event));
    $('ds-open').addEventListener('click', () => this.openTools());
    $('ds-close').addEventListener('click', () => $('ds-tools').close());
    $('ds-tools').addEventListener('close', () => view.canvas.focus({ preventScroll: true }));
    $('ds-upload').addEventListener('click', () => $('ds-rom-file').click());
    $('ds-rom-file').addEventListener('change', event => {
      const file = event.target.files[0]; event.target.value = '';
      if (file) void this.operation(() => this.load(file));
    });
    $('ds-demo').addEventListener('click', () => void this.operation(async () => {
      const response = await fetch(new URL('./assets/twin-lab.nds', document.baseURI));
      if (!response.ok) throw new Error(`The original DS demo could not load (HTTP ${response.status}).`);
      await this.load(new File([await response.blob()], 'Twin Lab.nds'));
    }));
    $('ds-pause').addEventListener('click', () => void this.operation(async () => {
      this.releaseInputs();
      this.paused = await this.command('setPaused', !this.paused);
    }));
    for (const id of ['ds-power', 'ds-hardware-power']) $(id).addEventListener('click', () =>
      void this.operation(() => this.togglePower()));
    $('ds-save').addEventListener('click', () => void this.operation(() => this.save()));
    $('ds-restore').addEventListener('click', () => void this.operation(async () => {
      const capture = await this.store.get(this.game.id);
      if (!capture) throw new Error('No DS checkpoint is stored for this cartridge yet.');
      await this.command('restore', capture);
      this.feedback('DS checkpoint restored.');
    }));
    $('ds-export').addEventListener('click', () => void this.operation(async () => {
      const capture = await this.command('capture');
      const url = URL.createObjectURL(await encodeDsBackup(this.game.id, capture));
      const link = document.createElement('a');
      link.href = url; link.download = `${this.game.title.replace(/[^a-z0-9 -]/gi, '').slice(0, 60) || 'DS'}.bbds-save`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      this.feedback('DS checkpoint download requested. Keep the .bbds-save file safe.');
    }));
    $('ds-import').addEventListener('click', () => $('ds-backup-file').click());
    $('ds-backup-file').addEventListener('change', event => {
      const file = event.target.files[0]; event.target.value = '';
      if (file) void this.operation(async () => {
        const capture = await decodeDsBackup(file, this.game.id);
        if (!confirm('Replace the running DS session and its checkpoint with this backup?')) return;
        if (this.storageAvailable) await this.persist(capture);
        await this.command('restore', capture);
        this.feedback('DS backup restored. GBA saves are unchanged.');
      });
    });
    $('ds-mute').addEventListener('change', () => void this.operation(() =>
      this.command('configure', this.preferences())));
    $('ds-cancel').addEventListener('click', () => this.launchCallbacks?.reject(new Error('DS launch cancelled. Choose a cartridge to retry.')));
    this.autosave = setInterval(() => {
      if (this.running && !this.busy && !this.paused && this.storageAvailable) void this.operation(() => this.save());
    }, 30000);
    view.dsController = this;
    this.showPowerOff();
    this.update();
  }

  async initialize() {
    try { await this.store.open(); this.storageAvailable = true; }
    catch (error) { console.error('DS storage:', error); this.feedback(error.message, true); }
    this.logo = new Image();
    try {
      await new Promise((resolve, reject) => {
        this.logo.onload = resolve;
        this.logo.onerror = () => reject(new Error('The supplied DS logo could not load.'));
        this.logo.src = new URL('./assets/ds-logo.png', document.baseURI).href;
      });
      const map = new THREE.Texture(this.logo);
      map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true;
      for (const emblem of this.model.branding) { emblem.material.map = map; emblem.material.needsUpdate = true; emblem.visible = true; }
      if (!this.powered) this.showPowerOff();
    } catch (error) { console.error('DS branding:', error); this.feedback(error.message, true); }
    this.update();
  }

  preferences() { return { ...defaultPreferences(), shader: 'disabled', muted: $('ds-mute').checked }; }
  inputAllowed() {
    return this.running && !this.busy && !this.paused && this.view.console === 'ds' &&
      this.view.mode === 'playing' && !this.view.transition && !document.querySelector('dialog[open]');
  }
  feedback(message, error = false) {
    $('ds-status').textContent = message;
    $('ds-status').classList.toggle('error', error);
    $('ds-status').setAttribute('role', error ? 'alert' : 'status');
  }
  async operation(action) {
    if (this.busy) return;
    this.busy = true; this.releaseInputs(); this.update();
    try { await action(); }
    catch (error) { console.error('DS player:', error); this.feedback(error.message, true); this.openTools(); }
    finally { this.busy = false; this.update(); }
  }
  async togglePower() {
    if (this.running) {
      await this.save();
      this.clear();
      this.powered = false;
      this.showPowerOff();
      this.feedback('DS powered off. Cartridge retained; Power on boots from its in-game save data.');
    } else if (this.cartridge) await this.launch(null, this.battery ?? null);
    else {
      this.feedback('Insert a DS .nds cartridge or try Twin Lab to power on.');
      this.openTools();
    }
  }
  update() {
    for (const id of ['ds-upload', 'ds-demo']) $(id).disabled = this.busy;
    $('ds-power').disabled = this.busy || !this.cartridge;
    $('ds-power').textContent = this.running ? 'Power off DS' : 'Power on DS';
    $('ds-hardware-power').setAttribute('aria-pressed', String(this.powered));
    $('ds-hardware-power').setAttribute('aria-label', this.running ? 'Power off DS' : 'Power on DS');
    $('ds-hardware-power').title = this.running ? 'Power off DS' : 'Power on DS';
    for (const id of ['ds-pause', 'ds-export', 'ds-import', 'ds-mute']) $(id).disabled = this.busy || !this.running;
    for (const id of ['ds-save', 'ds-restore']) $(id).disabled = this.busy || !this.running || !this.storageAvailable;
    $('ds-pause').textContent = this.paused ? 'Resume DS' : 'Pause DS';
    $('ds-cancel').hidden = !this.launchCallbacks;
    this.onState();
    this.view.host.dataset.dsPower = this.powered ? 'on' : 'off';
    this.model.led.material.emissiveIntensity = this.powered ? 28 : 0;
    this.view.changed = true;
    this.projectControls();
  }
  openTools() { this.releaseInputs(); if (!$('ds-tools').open) $('ds-tools').showModal(); }
  showPowerOff() {
    this.source = null;
    for (const screen of this.model.screens) {
      screen.material.map?.dispose(); screen.material.dispose();
      screen.material = new THREE.MeshPhysicalMaterial({
        color: '#101713', roughness: .24, clearcoat: 1, clearcoatRoughness: .22,
      });
    }
    this.view.changed = true;
  }
  status(title, detail) {
    this.source = null;
    for (const [index, screen] of this.model.screens.entries()) {
      const map = canvasTexture(512, 384, (ctx, w, h) => {
        ctx.fillStyle = '#081d2b'; ctx.fillRect(0, 0, w, h);
        if (index === 0 && this.logo?.complete && this.logo.naturalWidth) {
          const height = 450 * this.logo.height / this.logo.width;
          ctx.drawImage(this.logo, 31, (h - height) / 2, 450, height);
        } else {
          ctx.textAlign = 'center'; ctx.fillStyle = '#c9ed71';
          ctx.font = 'bold 26px monospace'; ctx.fillText(index ? title : 'BOWSERBOY DS', w / 2, 165, w - 24);
          ctx.fillStyle = '#8ed6e0'; ctx.font = '17px monospace'; ctx.fillText(index ? detail : 'TWO SCREENS. ONE LITTLE ESCAPE.', w / 2, 215, w - 24);
        }
      });
      screen.material.map?.dispose(); screen.material.dispose();
      screen.material = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    }
    this.view.changed = true;
  }
  clear() {
    this.releaseInputs();
    this.running = false; this.paused = false;
    this.frame?.remove(); this.frame = null;
    this.source = null;
    for (const { reject, timer } of this.pending.values()) { clearTimeout(timer); reject(new Error('The DS cartridge session ended.')); }
    this.pending.clear();
  }
  async load(file) {
    const game = await identifyDsRom(file);
    if (this.running) await this.save();
    await this.selectConsole('ds');
    const saved = this.storageAvailable ? await this.store.get(game.id) : null;
    this.clear();
    this.cartridge = file; this.game = game;
    this.battery = saved?.sram ?? null;
    $('ds-game').textContent = `${game.title} / ${(game.size / 1024 / 1024).toFixed(2)} MB / LOCAL NDS`;
    this.model.cartridge.visible = true;
    const moving = !this.view.reducedMotion.matches;
    this.model.cartridge.position.y = moving ? 3.1 : .44;
    this.inserting = moving ? { elapsed: 0, lastPaint: null } : null;
    this.view.host.dataset.dsCartridge = moving ? 'inserting' : 'seated';
    await this.launch(saved, null);
  }
  async launch(restore, battery) {
    this.clear();
    this.powered = true;
    this.status('READING DS CARTRIDGE', 'DOWNLOADING DESMUME');
    if ($('ds-tools').open) $('ds-tools').close();
    this.feedback('Loading pinned DeSmuME. First launch requires internet; Cancel is available.');
    this.session = crypto.randomUUID();
    this.frame = document.createElement('iframe');
    this.frame.title = 'Nintendo DS emulator';
    this.frame.allow = 'autoplay; gamepad';
    this.frame.referrerPolicy = 'no-referrer';
    this.frame.tabIndex = -1;
    this.frame.src = new URL('./player.html', document.baseURI).href;
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => this.launchCallbacks?.reject(new Error('DS did not start within 90 seconds. Check CDN access and use a supported DS .nds ROM.')), 90000);
        this.launchCallbacks = {
          resolve: () => { clearTimeout(timer); this.launchCallbacks = null; resolve(); },
          reject: error => { clearTimeout(timer); this.launchCallbacks = null; reject(error); },
        };
        this.frame.addEventListener('load', () => this.frame.contentWindow.postMessage({
          type: 'bba:init', system: 'ds', session: this.session, rom: this.cartridge, gameId: this.game.id,
          restore, battery, preferences: this.preferences(),
        }, location.origin), { once: true });
        $('ds-runtime-mount').replaceChildren(this.frame);
        this.update();
      });
      this.feedback(restore ? 'Latest DS checkpoint resumed. GBA saves are separate.' : 'DS cartridge running. Touch the lower screen; arrows, Z/X and C/V control the buttons.');
    } catch (error) {
      this.clear(); this.powered = false;
      this.status('DS COULD NOT START', 'OPEN DS CARTRIDGES TO RETRY');
      this.openTools();
      throw error;
    }
  }
  command(command, value) {
    if (!this.frame || !this.running) return Promise.reject(new Error('Load a DS cartridge first.'));
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(requestId); reject(new Error('The DS emulator did not respond. Your previous checkpoint is unchanged.')); }, 10000);
      this.pending.set(requestId, { resolve, reject, timer });
      this.frame.contentWindow.postMessage({ type: 'bba:command', session: this.session, requestId, command, value }, location.origin);
    });
  }
  message(event) {
    if (!this.frame || event.source !== this.frame.contentWindow || event.origin !== location.origin || event.data?.session !== this.session) return;
    const data = event.data;
    if (data.type === 'bba:started') {
      try {
        const canvas = this.frame.contentDocument.querySelector('canvas[data-bba-display]');
        if (!canvas) throw new Error('The DS core did not provide its display.');
        dsScreenRegions(canvas.width, canvas.height);
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl?.getContextAttributes().preserveDrawingBuffer) throw new Error('The DS framebuffer could not be retained for its physical screens.');
        this.source = canvas;
        this.outputs = this.model.screens.map(screen => {
          const map = canvasTexture(256, 192, () => {});
          map.minFilter = map.magFilter = THREE.NearestFilter; map.generateMipmaps = false;
          screen.material.map?.dispose(); screen.material.dispose();
          screen.material = new THREE.MeshBasicMaterial({ map, toneMapped: false });
          return map.image;
        });
        this.running = true;
        this.launchCallbacks?.resolve();
        this.update();
      } catch (error) { this.launchCallbacks?.reject(error); }
    } else if (data.type === 'bba:failed') {
      if (this.launchCallbacks) this.launchCallbacks.reject(new Error(data.message));
      else {
        this.clear(); this.powered = false;
        this.status('DS RUNTIME ERROR', 'OPEN DS CARTRIDGES TO RETRY');
        this.feedback(`DS emulator error: ${data.message}`, true);
        this.openTools(); this.update();
      }
    } else if (data.type === 'bba:result') {
      const entry = this.pending.get(data.requestId);
      if (entry) {
        clearTimeout(entry.timer); this.pending.delete(data.requestId);
        if (data.error) entry.reject(new Error(data.error)); else entry.resolve(data.result);
      }
    } else if (data.type === 'bba:control') {
      if (!DS_CONTROLS.some(control => control.id === data.action) || typeof data.pressed !== 'boolean') return;
      if (data.pressed) this.pressed.add(data.action); else this.pressed.delete(data.action);
      this.view.changed = true;
    } else if (data.type === 'bba:tools') this.openTools();
    else if (data.type === 'bba:notice') this.feedback(data.message, data.error === true);
  }
  async save() {
    const capture = await this.command('capture');
    this.battery = capture.sram;
    if (!this.storageAvailable) throw new Error('DS browser storage is unavailable. Use Export checkpoint before switching or powering off.');
    await this.persist(capture);
    this.feedback(`DS checkpoint saved at ${new Date().toLocaleTimeString()}. Export for a portable backup.`);
  }
  async persist(capture) {
    try { await this.store.put(this.game.id, capture); }
    catch (error) { this.storageAvailable = false; throw new Error(`DS checkpoint was not saved: ${error.message}. Export a backup before leaving.`); }
  }
  async suspend() {
    if (this.busy) throw new Error('Wait for the current DS action before switching consoles.');
    this.busy = true;
    this.releaseInputs();
    this.update();
    try {
      if (this.running && !this.paused) {
        if (this.storageAvailable) await this.save();
        else this.feedback('DS is retained in memory only. Browser saving is unavailable; export a checkpoint before leaving this page.', true);
        await this.command('setPaused', true);
        this.suspended = true;
      }
    } finally { this.busy = false; this.update(); }
  }
  async resume() {
    if (this.running && this.suspended) { await this.command('setPaused', false); this.suspended = false; }
  }
  input(action, pressed, source) {
    if (!this.running || !this.frame) return;
    this.frame.contentWindow.postMessage({ type: 'bba:input', session: this.session, action, pressed, source }, location.origin);
  }
  touchAt(event) {
    const bounds = this.view.canvas.getBoundingClientRect();
    this.view.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    this.view.raycaster.setFromCamera(this.view.pointer, this.view.camera);
    const hit = this.view.raycaster.intersectObject(this.model.root, true)[0];
    return hit?.object === this.model.screens[1] ? dsTouchFromUv(hit.uv) : null;
  }
  touch(point, pressed) {
    if (this.frame && this.running) this.frame.contentWindow.postMessage({ type: 'bba:touch', session: this.session, value: { ...point, pressed } }, location.origin);
  }
  releaseTouch() {
    if (this.touchPointer === undefined) return;
    this.touch(this.lastTouch, false);
    const id = this.touchPointer;
    this.touchPointer = undefined;
    if (this.view.canvas.hasPointerCapture(id)) this.view.canvas.releasePointerCapture(id);
  }
  releaseInputs() {
    this.keyboard.release(); this.releaseTouch();
    for (const { action, source } of this.pointers.values()) this.input(action, false, source);
    this.pointers.clear();
  }
  paint(time) {
    if (this.inserting) {
      const motion = this.inserting;
      motion.elapsed += Math.max(0, time - (motion.lastPaint ?? time));
      motion.lastPaint = time;
      const fraction = Math.min(1, motion.elapsed / 1800);
      const ease = fraction * fraction * (3 - 2 * fraction);
      this.model.cartridge.position.y = THREE.MathUtils.lerp(3.1, .44, ease);
      this.view.changed = true;
      if (fraction === 1) { this.inserting = null; this.view.host.dataset.dsCartridge = 'seated'; }
    }
    for (const [id, control] of this.model.controls) {
      const pressed = [...this.model.controls].some(([key, value]) => value.mesh === control.mesh && this.pressed.has(key));
      control.mesh.position.z = control.mesh.userData.restZ - (pressed ? .065 : 0);
    }
    if (!this.source) return;
    try {
      const regions = dsScreenRegions(this.source.width, this.source.height);
      for (const [i, region] of regions.entries()) {
        const ctx = this.outputs[i].getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.source, region.x, region.y, region.width, region.height, 0, 0, 256, 192);
        this.model.screens[i].material.map.needsUpdate = true;
      }
    } catch (error) {
      this.feedback(error.message, true);
      this.source = null; this.openTools();
    }
  }
  projectControls() {
    for (const [id, control] of this.model.controls) {
      const button = id === 'power' ? $('ds-hardware-power') : document.querySelector(`[data-ds-control="${id}"]`);
      button.hidden = this.view.console !== 'ds' || this.view.mode !== 'playing' || !!this.view.transition;
      button.disabled = id === 'power' ? this.busy : !this.inputAllowed();
      if (button.hidden) continue;
      const world = control.anchor.getWorldPosition(new THREE.Vector3());
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(this.model.root.matrixWorld);
      const projected = world.clone().project(this.view.camera);
      const facing = normal.dot(this.view.camera.position.clone().sub(world)) > 0;
      button.hidden = !facing || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1 || projected.z < -1 || projected.z > 1;
      if (button.hidden) continue;
      this.view.raycaster.setFromCamera(new THREE.Vector2(projected.x, projected.y), this.view.camera);
      const cover = this.view.raycaster.intersectObject(this.model.lid, true)[0];
      button.hidden = !!cover && cover.distance < this.view.camera.position.distanceTo(world) - .08;
      if (button.hidden) continue;
      const point = this.view.project(control.anchor);
      const distance = this.view.camera.position.distanceTo(control.anchor.getWorldPosition(new THREE.Vector3()));
      const scale = this.view.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.view.camera.fov / 2)) * distance);
      button.style.left = `${point.x}px`; button.style.top = `${point.y}px`;
      const minimum = id === 'power' ? 44 : 14;
      button.style.width = `${Math.max(minimum, control.width * scale)}px`;
      button.style.height = `${Math.max(minimum, control.height * scale)}px`;
    }
  }
}
