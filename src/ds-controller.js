import * as THREE from 'three';
import { DS_CONTROLS, decodeDsBackup, dsScreenRegions, dsTouchFromUv, encodeDsBackup, identifyDsRom } from './ds-cartridge.js';
import { defaultPreferences } from './preferences.js';
import { bindKeyboard } from './keyboard.js';
import { canvasTexture } from './handheld.js';
import { DsSaveStore } from './ds-store.js';
import { playDsStartupSound } from './startup.js';

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
    this.lastTouch = { x: 128, y: 96 };
    this.stylusHeld = false;
    // Keep the docked geometry in the model's bounds; only its held visual moves.
    this.heldStylus = this.model.stylus.clone(true);
    this.heldStylus.name = 'Picked-up camera-facing DS stylus';
    this.heldStylus.visible = false;
    this.heldStylus.scale.setScalar(.8);
    this.heldStylus.traverse(object => {
      object.castShadow = object.receiveShadow = false;
      object.raycast = () => {};
    });
    view.scene.add(this.heldStylus);
    this.stylusButton = document.createElement('button');
    this.stylusButton.id = 'ds-stylus';
    this.stylusButton.hidden = true;
    this.stylusButton.addEventListener('pointerenter', () => this.hoverStylus(true));
    this.stylusButton.addEventListener('pointerleave', () => this.hoverStylus(false));
    this.stylusButton.addEventListener('focus', () => this.hoverStylus(true));
    this.stylusButton.addEventListener('blur', () => this.hoverStylus(false));
    this.stylusButton.addEventListener('click', event => {
      if (this.stylusHeld) this.returnStylus();
      else this.pickUpStylus(event.detail ? event : null);
      view.canvas.focus({ preventScroll: true });
    });
    $('hardware-targets').append(this.stylusButton);
    this.returnStylus();
    this.keyboard = bindKeyboard(window, {
      enabled: event => this.inputAllowed() && !event.target.closest?.('button,input,select,textarea,[contenteditable="true"]'),
      getBindings: () => Object.fromEntries(DS_CONTROLS.map(({ id, code }) => [id, code])),
      onInput: (action, pressed, code) => this.input(action, pressed, `ds-key:${code}`),
      onMenu: () => {
        if (this.stylusHeld) { this.returnStylus(); return true; }
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
      this.trackStylus(event);
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
      this.trackStylus(event);
      if (event.pointerId !== this.touchPointer) return;
      const point = this.touchAt(event);
      if (!point) { this.releaseTouch(); return; }
      this.lastTouch = point;
      this.touch(point, true);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) view.canvas.addEventListener(name, event => {
      if (event.pointerId === this.touchPointer) this.releaseTouch(name !== 'pointerup');
      if (name === 'pointercancel') this.returnStylus();
      else if (name === 'pointerup' && event.pointerType !== 'mouse') this.stylusPointer = null;
    });
    view.canvas.addEventListener('pointerenter', event => this.trackStylus(event));
    view.canvas.addEventListener('pointerleave', () => {
      this.stylusPointer = null;
      this.hoverStylus(false);
      view.changed = true;
    });
    view.canvas.addEventListener('contextmenu', event => {
      if (!this.stylusHeld) return;
      event.preventDefault();
      this.returnStylus();
    });
    window.addEventListener('blur', () => { this.stylusPickup = false; this.releaseInputs(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { this.stylusPickup = false; this.releaseInputs(); }
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
    $('ds-mute').addEventListener('change', () => {
      if (this.running) void this.operation(() => this.command('configure', this.preferences()));
    });
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
    if (this.powered) {
      if (this.running) await this.save();
      this.clear();
      this.powered = false;
      this.showPowerOff();
      this.feedback(this.cartridge ? 'DS powered off. Cartridge retained; Power on boots from its in-game save data.' : 'DS powered off.');
    } else {
      this.powered = true;
      const sound = playDsStartupSound(this.preferences()).catch(error => {
        console.error('DS startup sound:', error);
        return error;
      });
      try {
        if (this.cartridge) await this.launch(null, this.battery ?? null);
        else {
          this.status('INSERT CARTRIDGE', 'OPEN DS CARTRIDGES');
          this.feedback('Insert a DS .nds cartridge or try Twin Lab to play.');
          this.openTools();
        }
      } finally {
        const error = await sound;
        if (error) this.feedback(`The DS startup chime could not play: ${error.message}`, true);
      }
    }
  }
  update() {
    for (const id of ['ds-upload', 'ds-demo']) $(id).disabled = this.busy;
    $('ds-power').disabled = this.busy;
    $('ds-power').textContent = this.powered ? 'Power off DS' : 'Power on DS';
    $('ds-hardware-power').setAttribute('aria-pressed', String(this.powered));
    $('ds-hardware-power').setAttribute('aria-label', this.powered ? 'Power off DS' : 'Power on DS');
    $('ds-hardware-power').title = this.powered ? 'Power off DS' : 'Power on DS';
    $('ds-mute').disabled = this.busy;
    for (const id of ['ds-pause', 'ds-export', 'ds-import']) $(id).disabled = this.busy || !this.running;
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
    const hit = this.view.raycaster.intersectObject(this.model.root, true)
      .find(hit => !(this.stylusHeld && hit.object.userData.dsStylus));
    return hit?.object === this.model.screens[1] ? dsTouchFromUv(hit.uv) : null;
  }
  touch(point, pressed, cancelled = false) {
    if (this.frame && this.running) this.frame.contentWindow.postMessage({ type: 'bba:touch', session: this.session, value: { ...point, pressed, cancelled } }, location.origin);
  }
  releaseTouch(cancelled = false) {
    if (this.touchPointer === undefined && !cancelled) return;
    this.touch(this.lastTouch, false, cancelled);
    if (this.touchPointer === undefined) return;
    const id = this.touchPointer;
    this.touchPointer = undefined;
    if (this.view.canvas.hasPointerCapture(id)) this.view.canvas.releasePointerCapture(id);
  }
  releaseInputs() {
    this.keyboard.release(); this.releaseTouch(true);
    this.returnStylus();
    for (const { action, source } of this.pointers.values()) this.input(action, false, source);
    this.pointers.clear();
  }
  stylusAvailable() {
    return this.view.console === 'ds' && this.view.mode === 'playing' &&
      !this.view.transition && !this.busy && !document.querySelector('dialog[open]');
  }
  hoverStylus(hovered) {
    const available = !this.view.transition && !this.busy &&
      (this.view.mode === 'table' || this.stylusAvailable());
    this.model.stylusGlow.visible = hovered && available && !this.stylusHeld;
    this.model.stylusPlastic.emissive.set('#8bff78');
    this.model.stylusPlastic.emissiveIntensity = this.model.stylusGlow.visible ? 45 : this.stylusHeld ? 8 : 0;
    this.view.changed = true;
  }
  pickUpStylus(event) {
    if (this.busy || this.view.transition || document.querySelector('dialog[open]')) return;
    if (this.view.mode === 'table') {
      void this.operation(async () => {
        await this.selectConsole('ds');
        this.stylusPickup = true;
      });
      return;
    }
    if (!this.stylusAvailable()) return;
    this.releaseTouch(true);
    this.stylusHeld = true;
    this.model.stylus.visible = false;
    this.view.host.dataset.dsStylus = 'held';
    this.stylusButton.setAttribute('aria-label', 'Return DS stylus');
    this.stylusButton.setAttribute('aria-pressed', 'true');
    this.stylusButton.title = 'Return stylus (Escape or right-click)';
    this.stylusButton.textContent = 'Put back';
    this.previousStylusHint = $('scene-hint').textContent;
    this.stylusHint = 'Stylus picked up. Click or drag on the lower LCD to draw. Escape, right-click or Put back returns it.';
    $('scene-hint').textContent = this.stylusHint;
    this.hoverStylus(false);
    if (event) this.trackStylus(event);
    else {
      const point = this.view.project(this.model.screens[1]);
      const bounds = this.view.canvas.getBoundingClientRect();
      this.stylusPointer = { clientX: bounds.left + point.x, clientY: bounds.top + point.y };
    }
    this.view.canvas.focus({ preventScroll: true });
  }
  returnStylus() {
    const held = this.stylusHeld;
    this.stylusHeld = false;
    this.heldStylus.visible = false;
    this.model.stylus.visible = true;
    this.stylusPointer = null;
    this.view.host.dataset.dsStylus = 'docked';
    this.stylusButton.setAttribute('aria-label', 'Pick up DS stylus');
    this.stylusButton.setAttribute('aria-pressed', 'false');
    this.stylusButton.title = 'Pick up stylus; click or drag on the lower LCD to draw';
    this.stylusButton.textContent = '';
    this.hoverStylus(false);
    if (held) {
      this.releaseTouch(true);
      if ($('scene-hint').textContent === this.stylusHint) $('scene-hint').textContent = this.previousStylusHint;
    }
    this.view.canvas.style.cursor = 'default';
    this.view.changed = true;
  }
  trackStylus(event) {
    if (!this.stylusHeld || (this.touchPointer !== undefined && event.pointerId !== this.touchPointer)) return;
    const bounds = this.view.canvas.getBoundingClientRect();
    this.stylusPointer = event.clientX >= bounds.left && event.clientX < bounds.right &&
      event.clientY >= bounds.top && event.clientY < bounds.bottom ?
      { clientX: event.clientX, clientY: event.clientY } : null;
    this.view.changed = true;
  }
  paintStylus() {
    if (this.stylusPickup && (this.view.console !== 'ds' || this.view.mode !== 'playing' ||
        document.querySelector('dialog[open]'))) this.stylusPickup = false;
    if (this.model.stylusGlow.visible && (this.view.transition || document.querySelector('dialog[open]'))) this.hoverStylus(false);
    if (this.stylusPickup && !this.view.transition) {
      this.stylusPickup = false;
      this.pickUpStylus();
    }
    if (!this.stylusHeld) return;
    if (!this.stylusAvailable()) { this.returnStylus(); return; }
    const visible = !!this.stylusPointer;
    if (this.heldStylus.visible !== visible) this.view.changed = true;
    this.heldStylus.visible = visible;
    this.view.canvas.style.cursor = visible ? 'none' : 'default';
    if (!visible) return;
    const bounds = this.view.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      (this.stylusPointer.clientX - bounds.left) / bounds.width * 2 - 1,
      -(this.stylusPointer.clientY - bounds.top) / bounds.height * 2 + 1);
    this.view.raycaster.setFromCamera(ndc, this.view.camera);
    const hit = this.view.raycaster.intersectObject(this.model.root, true)
      .find(hit => !hit.object.userData.dsStylus);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      this.view.camera.getWorldDirection(new THREE.Vector3()),
      this.model.screens[1].getWorldPosition(new THREE.Vector3()));
    const tip = hit?.point.clone() ?? this.view.raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    if (!tip) { this.heldStylus.visible = false; this.view.canvas.style.cursor = 'default'; return; }
    // Lift along the pointer ray, not the LCD normal, so the tip never shifts on screen.
    tip.addScaledVector(this.view.raycaster.ray.direction, this.touchPointer === undefined ? -.06 : -.008);
    const back = new THREE.Vector3(ndc.x > .65 ? -.32 : .32, ndc.y > .65 ? -.42 : .42, 1)
      .applyQuaternion(this.view.camera.quaternion).normalize();
    this.heldStylus.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), back);
    const offset = this.model.stylusTip.position.clone().multiply(this.heldStylus.scale)
      .applyQuaternion(this.heldStylus.quaternion);
    const position = tip.sub(offset);
    this.view.changed ||= !this.heldStylus.position.equals(position);
    this.heldStylus.position.copy(position);
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
    this.projectStylus();
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
  projectStylus() {
    const button = this.stylusButton;
    button.hidden = !this.stylusAvailable();
    button.disabled = !this.stylusAvailable();
    if (button.hidden) return;
    const world = this.model.stylus.getWorldPosition(new THREE.Vector3());
    const point = world.clone().project(this.view.camera);
    this.view.raycaster.setFromCamera(new THREE.Vector2(point.x, point.y), this.view.camera);
    const hit = this.view.raycaster.intersectObject(this.model.root, true)
      .find(hit => !this.stylusHeld || !hit.object.userData.dsStylus);
    button.hidden = Math.abs(point.x) > .95 || Math.abs(point.y) > .95 || point.z < -1 || point.z > 1 ||
      (!!hit && !hit.object.userData.dsStylus && hit.distance < this.view.camera.position.distanceTo(world) - .16);
    const projected = this.view.project(this.model.stylus);
    button.style.left = `${projected.x}px`; button.style.top = `${projected.y}px`;
    button.style.width = '44px'; button.style.height = '44px';
  }
}
