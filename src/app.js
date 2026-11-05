import { MANUAL_SLOTS, RUNTIME, decodeBackup, encodeBackup, identifyRom, latestSlot, validateBatterySave } from './cartridge.js';
import { SaveStore } from './save-store.js';
import { CONTROLS, CRT_GEOM, CRT_SHADERS, defaultPreferences, keyLabel, readPreferences, rebindControl, validatePreferences, writePreferences } from './preferences.js';
import { bindKeyboard } from './keyboard.js';
import { HandheldScene } from './scene.js';
import { playStartup, playStartupSound } from './startup.js';
import { icon } from './icons.js';
import { loadBrand } from './brand.js';

const $ = (id) => document.getElementById(id);
const store = new SaveStore();
let game = null;
let record = null;
let cartridge = null;
let batterySave = null;
let frame = null;
let session = null;
let running = false;
let powered = false;
let busy = true;
let storageAvailable = false;
let autoSave = true;
let selectedSlot = 'manual';
let launchCallbacks = null;
const pending = new Map();
const pointers = new Map();
let preferences = defaultPreferences();
let remappingAction = null;
let preferenceWarning = null;
export let view = null;
let sceneFailure = null;
try { preferences = readPreferences(localStorage); }
catch (error) {
  console.error('Player preferences:', error);
  preferenceWarning = `${error.message} Default keys and sound are active for this session.`;
}
autoSave = preferences.autoSave;
$('shader').replaceChildren(...CRT_SHADERS.map(({ label, value }) => new Option(label, value)),
  new Option('Unfiltered', 'disabled'));
for (const [id, name, label] of [
  ['pickup', 'pickup', 'Pick up handheld'], ['inspect', 'inspect', 'Inspect handheld'],
  ['put-down', 'down', 'Put down handheld'], ['lamp-toggle', 'lamp', 'Turn desk lamp off'],
  ['room-toggle', 'room', 'Turn room lights on'], ['tools-open', 'cartridge', 'Open cartridge and settings'],
  ['quick-fullscreen', 'fullscreen', 'Fullscreen player'], ['quick-controls', 'keys', 'Change control keybindings'],
  ['quick-screen-fullscreen', 'screen', 'Fullscreen game screen'], ['screen-focus-close', 'close', 'Exit screen fullscreen'],
  ['quick-slots', 'slots', 'Choose checkpoint slot'], ['quick-restart', 'restart', 'Restart GBA: power off and on'],
]) icon($(id), name, label);

function renderQuickControls() {
  const number = MANUAL_SLOTS.indexOf(selectedSlot) + 1;
  const saved = record?.[selectedSlot];
  icon($('quick-save'), 'save', `Save checkpoint to slot ${number}`);
  icon($('quick-load'), 'load', `Load last checkpoint from slot ${number}`);
  icon($('quick-autosave'), 'autosave', `Turn automatic checkpoints ${autoSave ? 'off' : 'on'}`);
  $('quick-autosave').setAttribute('aria-pressed', String(autoSave));
  $('autosave-toggle').setAttribute('aria-pressed', String(autoSave));
  $('autosave-description').textContent = autoSave ? 'A checkpoint every 15 seconds.' : 'Off. Use Save checkpoint before leaving.';
  $('quick-save-time').textContent = saved ? new Date(saved.createdAt).toLocaleString() : `Slot ${number} is empty.`;
  for (const [index, slot] of MANUAL_SLOTS.entries()) {
    $('checkpoint-slot').options[index].textContent = `Slot ${index + 1}${record?.[slot] ? ' / saved' : ' / empty'}`;
  }
  const options = preferences.emulatorOptions;
  const speed = options?.fastForward === 'enabled' ? options['ff-ratio'] ?? '2.0' : '1';
  const label = speed === 'unlimited' ? 'MAX' : `${Number(speed)}x`;
  icon($('quick-speed'), 'speed', `Emulation speed: ${label}`, label);
  $('quick-speed').setAttribute('aria-pressed', String(speed !== '1'));
  for (const button of document.querySelectorAll('[data-speed]')) {
    button.disabled = !running || busy;
    button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === Number(speed)));
  }
}

function notice(message, error = false) {
  moveNotice();
  $('notice-text').textContent = message;
  $('notice').classList.toggle('error', error);
  $('notice').hidden = false;
}

function storageFailure(error) {
  console.error('Browser progress storage:', error);
  autoSave = false;
  preferences = { ...preferences, autoSave: false };
  $('autosave-toggle').setAttribute('aria-pressed', 'false');
  $('autosave-description').textContent = 'Off. Export a backup to protect this session.';
  renderQuickControls();
  $('storage-badge').textContent = 'SAVE ERROR';
  $('storage-badge').classList.add('error');
  $('save-status').textContent = 'Browser saving failed. Export a backup now; reload the page to retry storage.';
  notice(`${error.message} Progress has not been saved to this browser. You can still export a backup.`, true);
}

const storageReady = store.open().then(() => {
  storageAvailable = true;
  $('storage-badge').textContent = 'LOCAL ONLY';
}).catch((error) => {
  storageFailure(error);
});

function updateControls() {
  for (const id of ['upload', 'rom-file', 'demo', 'volume', 'mute', 'shader', 'reset-controls']) $(id).disabled = busy;
  for (const id of ['pause', 'fullscreen', 'export', 'import', 'native-open']) $(id).disabled = !running || busy;
  $('native-close').disabled = busy;
  $('hardware-power').disabled = busy || !view;
  $('hardware-power').setAttribute('aria-pressed', String(powered));
  $('hardware-power').setAttribute('aria-label', `Turn power ${powered ? 'off' : 'on'}`);
  $('hardware-power').title = `Power ${powered ? 'off' : 'on'}`;
  $('scene').dataset.power = powered ? 'on' : 'off';
  $('load-cancel').hidden = !launchCallbacks;
  for (const button of document.querySelectorAll('[data-control]')) button.disabled = !running;
  for (const button of document.querySelectorAll('[data-binding]')) button.disabled = busy;
  $('save').disabled = !running || busy || !storageAvailable;
  $('restore').disabled = !running || busy || !record?.[selectedSlot];
  $('autosave-toggle').disabled = !storageAvailable || busy;
  $('checkpoint-slot').disabled = busy;
  $('quick-save').disabled = $('save').disabled;
  $('quick-load').disabled = $('restore').disabled;
  $('quick-autosave').disabled = $('autosave-toggle').disabled;
  for (const id of ['quick-speed', 'quick-restart']) $(id).disabled = !running || busy;
  $('quick-screen-fullscreen').disabled = !running || busy;
  for (const id of ['quick-controls', 'quick-slots', 'quick-fullscreen']) $(id).disabled = busy;
  $('power-led').classList.toggle('on', powered);
  view?.setPower(powered);
  renderQuickControls();
}

async function operation(action) {
  if (busy) return;
  busy = true;
  updateControls();
  try { await action(); }
  catch (error) {
    console.error('Player action:', error);
    notice(error.message, true);
  } finally {
    busy = false;
    updateControls();
  }
}

function command(name, value) {
  if (!running || !frame) return Promise.reject(new Error('Load a cartridge before using player controls.'));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error('The emulator did not respond. Your previous browser checkpoints are still available.'));
    }, 10000);
    pending.set(requestId, { resolve, reject, timer });
    frame.contentWindow.postMessage({
      type: 'bba:command', session, requestId, command: name, value,
    }, location.origin);
  });
}

function clearPlayer() {
  releaseHostInputs();
  if ($('frame-host').open) $('frame-host').close();
  $('frame-host').setAttribute('aria-hidden', 'true');
  if (powered) view?.showStatus('INSERT CARTRIDGE', 'ESC / CARTRIDGES & SETTINGS');
  else view?.showPowerOff();
  for (const { id } of CONTROLS) view?.setControl(id, false);
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(new Error('The cartridge session ended before the action completed.'));
  }
  pending.clear();
  frame?.remove();
  frame = null;
  running = false;
  session = null;
  $('pause').setAttribute('aria-label', 'Pause game');
  $('pause').title = 'Pause game';
  $('pause').textContent = 'Pause game';
  for (const button of document.querySelectorAll('[data-control]')) button.classList.remove('pressed');
}

async function persist(slot, capture = null) {
  capture ??= await command('capture');
  try {
    record = await store.putSlot(game, slot, capture);
  } catch (error) {
    storageFailure(error);
    throw new Error('The checkpoint could not be stored. Export a backup to protect this session.');
  }
  $('storage-badge').textContent = 'SAVED HERE';
  $('storage-badge').classList.remove('error');
  $('save-status').textContent = `Saved at ${new Date(record[slot].createdAt).toLocaleTimeString()}. Local to this browser; export a backup to keep it safe.`;
  updateControls();
  return capture;
}

function launch(file, restore, battery = null) {
  if (!view) throw new Error(sceneFailure?.message ?? 'The 3D display is not available.');
  clearPlayer();
  view.insertCartridge(game.id);
  view.setView('playing');
  view.showStatus(restore ? 'RESUMING YOUR GAME' : 'READING CARTRIDGE', 'DOWNLOADING THE EMULATOR');
  if ($('tools').open) $('tools').close();
  $('notice').hidden = true;
  $('empty-screen').hidden = true;
  $('loading-screen').hidden = false;
  $('loading-title').textContent = restore ? 'Finding your place again...' : 'Warming up the pixels...';
  $('loading-detail').textContent = 'Downloading mGBA from the emulator CDN. First launch can take a moment.';
  $('power-label').textContent = 'LOADING CARTRIDGE';
  session = crypto.randomUUID();
  frame = document.createElement('iframe');
  frame.title = `${game.title} - GBA emulator`;
  frame.allow = 'autoplay; fullscreen; gamepad';
  frame.referrerPolicy = 'no-referrer';
  frame.tabIndex = -1;
  frame.src = new URL('./player.html', document.baseURI).href;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      launchCallbacks?.reject(new Error('The emulator did not start within 90 seconds. Check your internet connection, then choose the ROM again.'));
    }, 90000);
    launchCallbacks = {
      resolve: () => { clearTimeout(timer); launchCallbacks = null; resolve(); },
      reject: (error) => { clearTimeout(timer); launchCallbacks = null; reject(error); },
    };
    updateControls();
    frame.addEventListener('load', () => {
      frame.contentWindow.postMessage({
        type: 'bba:init', session, rom: file, gameId: game.id, restore, battery, preferences,
      }, location.origin);
    }, { once: true });
    $('runtime-mount').replaceChildren(frame);
  }).catch((error) => {
    clearPlayer();
    $('loading-screen').hidden = true;
    $('empty-screen').hidden = false;
    $('empty-screen').textContent = 'Power is on. Choose a cartridge to retry loading.';
    $('power-label').textContent = 'POWER ON / CHOOSE A CARTRIDGE TO RETRY';
    throw error;
  });
}

async function rememberDevice(nextPowered = powered, file = cartridge) {
  if (!storageAvailable) return;
  try { await store.putDevice(nextPowered, file); }
  catch (error) {
    console.error('Saving console state:', error);
    throw new Error('The console state could not be remembered. Power and the current cartridge have not been changed. Free browser storage and try again.');
  }
}

async function loadRom(file, { remember = true } = {}) {
  const identified = await identifyRom(file);
  if (!view) throw new Error(sceneFailure?.message ?? 'The 3D display is not available.');
  await storageReady;
  if (running) {
    if (autoSave && storageAvailable) await persist('automatic');
    else if (!confirm('Switch cartridges? Automatic saving is off. Unsaved progress will be lost; cancel to save or export first.')) return;
  }
  let saved = null;
  if (storageAvailable) {
    try { saved = await store.get(identified.id); }
    catch (error) { storageAvailable = false; storageFailure(error); }
  }
  if (saved && saved.runtime !== RUNTIME) {
    throw new Error('This game has saves from an incompatible emulator version. Keep your backups before changing runtime versions.');
  }
  if (remember) await rememberDevice(powered, file);
  game = identified;
  record = saved;
  cartridge = file;
  batterySave = validateBatterySave(record?.battery ? record.battery.sram : latestSlot(record)?.sram ?? null);
  $('game-title').textContent = game.title;
  const size = game.size < 1024 * 1024 ? `${Math.ceil(game.size / 1024)} KB` : `${(game.size / 1024 / 1024).toFixed(2)} MB`;
  $('game-meta').textContent = `GAME BOY ADVANCE / ${size} / LOCAL CARTRIDGE`;
  $('game-monogram').textContent = game.title.slice(0, 1).toUpperCase();
  $('quick-save-time').textContent = record?.manual ? new Date(record.manual.createdAt).toLocaleString() : 'Your safety net for the tricky bits.';
  if (!powered) {
    view.insertCartridge(game.id, remember);
    if (remember) view.setView('playing');
    if ($('tools').open) $('tools').close();
    view.showPowerOff();
    $('empty-screen').hidden = false;
    $('empty-screen').textContent = 'Cartridge inserted. Turn on the physical power switch to play.';
    $('power-label').textContent = 'POWER OFF / CARTRIDGE RETAINED';
    if (remember) notice(storageAvailable ? 'Cartridge inserted. Use the physical power switch to turn it on.' :
      'Cartridge inserted for this page session only. Browser storage is unavailable; refreshing cannot remember the power or cartridge.', !storageAvailable);
    return;
  }
  const checkpoint = record?.bootMode === 'battery' ? null : latestSlot(record);
  await launch(file, checkpoint, checkpoint ? null : batterySave);
  if (storageAvailable && !$('storage-badge').classList.contains('error')) {
    $('storage-badge').textContent = checkpoint ? 'RESUMED' : 'LOCAL ONLY';
    $('save-status').textContent = checkpoint ? 'Checkpoint restored. Progress is local to this browser; export a backup regularly.' :
      'ROM booted from the beginning with available in-game save data. Checkpoints remain separate.';
  }
  if (checkpoint) notice('Welcome back. Your latest checkpoint has been restored.');
}

function chooseRom(file) {
  return operation(() => loadRom(file));
}

window.addEventListener('message', (event) => {
  if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin ||
      event.data?.session !== session) return;
  const data = event.data;
  switch (data.type) {
    case 'bba:started':
      try {
        const canvas = frame.contentDocument.querySelector('canvas[data-bba-display]');
        const context = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        if (!context?.getContextAttributes().preserveDrawingBuffer) {
          throw new Error('The emulator could not retain its live 3D screen. Choose the cartridge again to retry.');
        }
        view.setScreen(canvas);
      } catch (error) {
        launchCallbacks?.reject(error);
        break;
      }
      running = true;
      void command('setInputEnabled', view.mode === 'playing' && !view.transition).catch((error) => notice(error.message, true));
      $('loading-screen').hidden = true;
      $('power-label').textContent = 'CARTRIDGE IN / GOOD TIMES ON';
      launchCallbacks?.resolve();
      updateControls();
      view.canvas.focus({ preventScroll: true });
      break;
    case 'bba:failed':
      if (launchCallbacks) launchCallbacks.reject(new Error(data.message));
      else notice(`Emulator error: ${data.message}`, true);
      break;
    case 'bba:notice': notice(data.message, data.error === true); break;
    case 'bba:tools': openTools(); break;
    case 'bba:settings-close': void closeNativeSettings(); break;
    case 'bba:control':
      if (CONTROLS.some(({ id }) => id === data.action) && typeof data.pressed === 'boolean') {
        document.querySelector(`[data-control="${data.action}"]`).classList.toggle('pressed', data.pressed);
        view?.setControl(data.action, data.pressed);
      }
      break;
    case 'bba:result': {
      const entry = pending.get(data.requestId);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(data.requestId);
      if (data.error) entry.reject(new Error(data.error));
      else entry.resolve(data.result);
      break;
    }
  }
});

$('upload').addEventListener('click', () => $('rom-file').click());
$('rom-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) void chooseRom(file);
});
$('demo').addEventListener('click', () => {
  void operation(async () => {
    const response = await fetch(new URL('./assets/pixel-lab.gba', document.baseURI));
    if (!response.ok) throw new Error(`The demo cartridge could not load (HTTP ${response.status}).`);
    const file = new File([await response.blob()], 'Pixel Lab.gba');
    await loadRom(file);
  });
});
$('load-cancel').addEventListener('click', () => launchCallbacks?.reject(new Error('Launch cancelled. Choose a cartridge when you are ready.')));
async function togglePause() {
  const paused = await command('togglePause');
  $('pause').setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
  $('pause').title = paused ? 'Resume game' : 'Pause game';
  $('pause').textContent = paused ? 'Resume game' : 'Pause game';
  $('power-label').textContent = paused ? 'TAKE YOUR TIME / GAME PAUSED' : 'CARTRIDGE IN / GOOD TIMES ON';
}
$('pause').addEventListener('click', () => void operation(togglePause));
async function togglePower() {
  if (powered) {
    let sram = batterySave;
    if (running) {
      releaseHostInputs();
      sram = validateBatterySave(await command('battery'));
      if (storageAvailable) {
        try { record = await store.putBattery(game, sram); }
        catch (error) {
          storageFailure(error);
          throw new Error('Power is still on because the in-game save could not be stored. Export a backup before trying again.');
        }
        $('storage-badge').textContent = sram === null ? 'POWER OFF' : 'BATTERY SAVED';
        $('storage-badge').classList.remove('error');
        $('save-status').textContent = 'Available in-game save data stored separately. Power on boots the ROM; checkpoints remain unchanged.';
      }
    }
    await rememberDevice(false);
    batterySave = sram;
    powered = false;
    clearPlayer();
    $('empty-screen').textContent = 'Power off. Turn the physical switch on to restart the loaded cartridge.';
    $('empty-screen').hidden = false;
    $('power-label').textContent = 'POWER OFF / CARTRIDGE RETAINED';
    notice(storageAvailable ? 'Power off. Available in-game save data is stored; checkpoints were not changed.' :
      'Power off. In-game save data is kept for this page session only because browser storage is unavailable. Reloading will lose it.', !storageAvailable);
  } else {
    await rememberDevice(true);
    powered = true;
    updateControls();
    view.setView('playing');
    $('empty-screen').hidden = true;
    $('notice').hidden = true;
    $('power-label').textContent = 'STARTING / INFINITE BATTERY';
    const sound = playStartupSound(preferences).catch((error) => {
      console.error('Startup sound:', error);
      return error;
    });
    await playStartup(view);
    if (cartridge) await launch(cartridge, null, batterySave);
    else {
      view.showStatus('INSERT CARTRIDGE', 'ESC / CARTRIDGES & SETTINGS');
      $('empty-screen').hidden = false;
      $('empty-screen').textContent = 'Power on. Open Cartridges to insert a ROM.';
      $('power-label').textContent = 'POWER ON / INSERT CARTRIDGE';
    }
    const soundError = await sound;
    if (soundError) notice(`Power is on, but the startup chime could not play: ${soundError.message}`, true);
    else notice(!storageAvailable ? 'Power on for this page session only. Browser storage is unavailable; refreshing cannot remember the console.' :
      cartridge ? 'Power on. The ROM restarted from the beginning with its in-game save, not a checkpoint.' :
        'Power on. Insert a cartridge whenever you are ready. Infinite battery included.');
  }
}
$('hardware-power').addEventListener('click', () => void operation(togglePower));
$('quick-restart').addEventListener('click', () => void operation(async () => {
  await togglePower();
  updateControls();
  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 350)));
  await togglePower();
}));
function fullscreen() {
  if ($('tools').open) $('tools').close();
  const action = document.fullscreenElement ? document.exitFullscreen() : $('player').requestFullscreen?.();
  if (!action) { notice('Fullscreen is not supported here. Try rotating your device for a larger view.'); return; }
  void action.catch((error) => notice(`Fullscreen could not open: ${error.message}`, true));
}
$('fullscreen').addEventListener('click', fullscreen);
$('quick-fullscreen').addEventListener('click', fullscreen);
let screenFrame = null;
function paintFullscreenScreen() {
  if (document.fullscreenElement !== $('screen-focus')) return;
  try {
    const source = view?.source ?? view?.model.screen.material.map?.image;
    if (!source) throw new Error('The live LCD is unavailable. Return to the desk to retry.');
    const canvas = $('screen-focus-canvas');
    if (canvas.width !== source.width || canvas.height !== source.height) {
      canvas.width = source.width;
      canvas.height = source.height;
    }
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not create the fullscreen display.');
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 0, 0);
    screenFrame = requestAnimationFrame(paintFullscreenScreen);
  } catch (error) {
    console.error('Screen fullscreen:', error);
    notice(error.message, true);
    void document.exitFullscreen().catch(failure => notice(`Fullscreen could not close: ${failure.message}`, true));
  }
}
function closeScreenFullscreen() {
  if (document.fullscreenElement !== $('screen-focus')) return;
  void document.exitFullscreen().catch(error => notice(`Fullscreen could not close: ${error.message}`, true));
}
$('quick-screen-fullscreen').addEventListener('click', () => {
  if (!running || busy) return;
  if (!$('screen-focus').requestFullscreen) {
    notice('Screen fullscreen is not supported by this browser.', true);
    return;
  }
  $('screen-focus').hidden = false;
  void $('screen-focus').requestFullscreen().catch(error => {
    $('screen-focus').hidden = true;
    notice(`Screen fullscreen could not open: ${error.message}`, true);
  });
});
$('screen-focus-close').addEventListener('click', closeScreenFullscreen);
$('screen-focus-zoom').addEventListener('input', () => {
  const zoom = $('screen-focus-zoom').valueAsNumber;
  $('screen-focus').style.setProperty('--screen-zoom', zoom / 100);
  $('screen-focus-zoom-value').value = `${zoom}%`;
});
$('play-zoom').addEventListener('input', () => {
  const zoom = $('play-zoom').valueAsNumber;
  view.setPlayZoom(zoom / 100);
  $('play-zoom-value').value = `${zoom}%`;
});
document.addEventListener('fullscreenchange', () => {
  const focused = document.fullscreenElement === $('screen-focus');
  $('play-zoom-control').hidden = focused || view?.mode !== 'playing' || !!view?.transition;
  $('quick-screen-fullscreen').setAttribute('aria-pressed', String(focused));
  if (focused) {
    releaseHostInputs();
    $('screen-focus-canvas').focus({ preventScroll: true });
    paintFullscreenScreen();
  } else if (!$('screen-focus').hidden) {
    cancelAnimationFrame(screenFrame);
    screenFrame = null;
    $('screen-focus').hidden = true;
    releaseHostInputs();
    if (view) view.changed = true;
    $('quick-screen-fullscreen').focus({ preventScroll: true });
  }
  if (running) void command('setInputEnabled', focused || (view?.mode === 'playing' && !view.transition))
    .catch(error => notice(error.message, true));
});
function saveCheckpoint() {
  return operation(async () => {
    await persist(selectedSlot);
    notice(`Checkpoint saved. Slot ${MANUAL_SLOTS.indexOf(selectedSlot) + 1} is ready to restore.`);
  });
}
function restoreCheckpoint() {
  return operation(async () => {
    const saved = record?.[selectedSlot];
    if (!saved) throw new Error('There is no checkpoint in the selected slot yet.');
    if (!confirm('Restore the quick-save checkpoint? Progress since that checkpoint will be replaced.')) return;
    await command('restore', saved);
    if (autoSave && storageAvailable) await persist('automatic', saved);
    notice('Quick-save checkpoint restored.');
  });
}
for (const id of ['save', 'quick-save']) $(id).addEventListener('click', () => void saveCheckpoint());
for (const id of ['restore', 'quick-load']) $(id).addEventListener('click', () => void restoreCheckpoint());
$('checkpoint-slot').addEventListener('change', () => {
  selectedSlot = $('checkpoint-slot').value;
  updateControls();
});
$('export').addEventListener('click', () => void operation(async () => {
  const capture = await command('capture');
  const backup = await encodeBackup(game, capture);
  const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${game.title.replace(/[^a-z0-9 -]/gi, '').slice(0, 60) || 'cartridge'}-${new Date().toISOString().slice(0, 10)}.bba-save`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  notice('Backup download requested. Keep the .bba-save file somewhere safe.');
}));
$('import').addEventListener('click', () => $('backup-file').click());
$('backup-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  void operation(async () => {
    if (!running) throw new Error('Load the matching cartridge before importing a backup.');
    const capture = await decodeBackup(file, game.id);
    if (!confirm('Import this backup? It replaces the running session and the selected checkpoint slot.')) return;
    if (storageAvailable) await persist(selectedSlot, capture);
    await command('restore', capture);
    if (autoSave && storageAvailable) await persist('automatic', capture);
    notice(storageAvailable ? 'Backup imported and stored in this browser.' : 'Backup loaded for this session only. Browser saving is unavailable.', !storageAvailable);
  });
});
for (const id of ['autosave-toggle', 'quick-autosave']) $(id).addEventListener('click', () => {
  void operation(() => applyPreferences({ ...preferences, autoSave: !autoSave }));
});
for (const button of document.querySelectorAll('[data-speed]')) button.addEventListener('click', () => {
  void operation(async () => {
    const speed = Number(button.dataset.speed);
    await applyPreferences({ ...preferences, emulatorOptions: {
      ...preferences.emulatorOptions, 'ff-ratio': `${speed}.0`,
      fastForward: speed > 1 ? 'enabled' : 'disabled', slowMotion: 'disabled',
    } });
    $('speed-menu').hidePopover();
  });
});

async function automaticCheckpoint() {
  if (!running || !autoSave || !storageAvailable || busy) return;
  await operation(() => persist('automatic'));
}
setInterval(() => void automaticCheckpoint(), 15000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void automaticCheckpoint();
});
window.addEventListener('beforeunload', (event) => {
  if (!running) return;
  event.preventDefault();
  event.returnValue = '';
});

let dragDepth = 0;
document.addEventListener('dragenter', (event) => {
  if (!event.dataTransfer?.types.includes('Files')) return;
  event.preventDefault();
  dragDepth++;
  document.body.classList.add('dragging');
});
document.addEventListener('dragover', (event) => {
  if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
});
document.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging'); }
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  if (busy) { notice('Wait for the current player action to finish before changing cartridges.'); return; }
  if (event.dataTransfer.files.length !== 1) { notice('Choose one .gba cartridge at a time.', true); return; }
  void chooseRom(event.dataTransfer.files[0]);
});
$('help-open').addEventListener('click', () => $('help').showModal());
$('help-close').addEventListener('click', () => $('help').close());
$('notice-dismiss').addEventListener('click', () => { $('notice').hidden = true; });

function moveNotice() {
  const host = $($('frame-host').open ? 'native-notice-host' : $('tools').open ? 'drawer-notice-host' : 'notice-host');
  if ($('notice').parentElement !== host) host.append($('notice'));
}

function sendInput(action, pressed, source) {
  if (!running || !frame) return;
  frame.contentWindow.postMessage({ type: 'bba:input', session, action, pressed, source }, location.origin);
}

function releasePointer(event) {
  const held = pointers.get(event.pointerId);
  if (!held) return;
  pointers.delete(event.pointerId);
  const release = () => sendInput(held.action, false, held.source);
  const remaining = 40 - (performance.now() - held.pressedAt);
  if (remaining > 0) setTimeout(release, remaining);
  else release();
}

function releaseHostInputs() {
  keyboard.release();
  for (const pointerId of [...pointers.keys()]) releasePointer({ pointerId });
}

function openTools() {
  if ($('tools').open || $('help').open || $('frame-host').open) return;
  releaseHostInputs();
  $('tools').showModal();
  moveNotice();
}

$('native-open').addEventListener('click', () => void operation(async () => {
  releaseHostInputs();
  await command('settings', true);
  $('tools').close();
  $('frame-host').setAttribute('aria-hidden', 'false');
  frame.tabIndex = 0;
  $('frame-host').showModal();
  moveNotice();
  $('native-close').focus();
}));

function closeNativeSettings() {
  return operation(async () => {
    const emulatorOptions = await command('settings', false);
    $('frame-host').close();
    $('frame-host').setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    openTools();
    await applyPreferences({ ...preferences, emulatorOptions });
    $('native-open').focus();
  });
}
$('native-close').addEventListener('click', () => void closeNativeSettings());
$('frame-host').addEventListener('cancel', (event) => {
  event.preventDefault();
  void closeNativeSettings();
});

$('tools-open').addEventListener('click', openTools);
for (const [id, target] of [['quick-controls', 'controls-heading'], ['quick-slots', 'checkpoint-slot']]) {
  $(id).addEventListener('click', () => {
    openTools();
    $(target).scrollIntoView({ block: 'center', behavior: 'instant' });
    if (target === 'checkpoint-slot') $(target).focus();
    else document.querySelector('[data-binding]').focus({ preventScroll: true });
  });
}
$('tools-close').addEventListener('click', () => $('tools').close());
$('tools').addEventListener('close', () => {
  remappingAction = null;
  $('key-status').textContent = 'Escape is reserved for this drawer.';
  renderPreferences();
  moveNotice();
  view?.canvas.focus({ preventScroll: true });
});

for (const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('pointerdown', (event) => {
    if (!running || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    const source = `host-pointer:${event.pointerId}:${crypto.randomUUID()}`;
    pointers.set(event.pointerId, { action: button.dataset.control, source, pressedAt: performance.now() });
    sendInput(button.dataset.control, true, source);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, releasePointer);
  button.addEventListener('click', (event) => {
    if (event.detail !== 0 || !running) return;
    const source = `host-button:${crypto.randomUUID()}`;
    sendInput(button.dataset.control, true, source);
    setTimeout(() => sendInput(button.dataset.control, false, source), 100);
  });
}

function renderPreferences() {
  for (const { id, label } of CONTROLS) {
    const button = document.querySelector(`[data-binding="${id}"]`);
    button.textContent = remappingAction === id ? 'Press key' : keyLabel(preferences.controls[id]);
    button.classList.toggle('capturing', remappingAction === id);
    button.setAttribute('aria-label', `Change ${label} key, currently ${keyLabel(preferences.controls[id])}`);
    document.querySelector(`[data-control="${id}"]`).title = `${label} (${keyLabel(preferences.controls[id])})`;
  }
  $('volume').value = preferences.volume;
  $('volume-value').textContent = `${preferences.volume}%`;
  $('mute').textContent = preferences.muted ? 'Unmute' : 'Mute';
  $('mute').setAttribute('aria-pressed', String(preferences.muted));
  const shader = preferences.emulatorOptions?.shader ?? preferences.shader;
  view?.setScreenCurve(shader === CRT_GEOM);
  $('shader').querySelector('[data-native-shader]')?.remove();
  if (![...$('shader').options].some(option => option.value === shader)) {
    const option = new Option(`EmulatorJS: ${shader}`, shader);
    option.dataset.nativeShader = '';
    option.disabled = true;
    $('shader').add(option);
  }
  $('shader').value = shader;
}

async function applyPreferences(next) {
  next = validatePreferences(next);
  releaseHostInputs();
  if (running) await command('configure', next);
  preferences = next;
  autoSave = next.autoSave && storageAvailable;
  renderPreferences();
  try {
    writePreferences(localStorage, preferences);
    $('preferences-status').textContent = 'Keys, sound and display settings saved in this browser.';
  } catch (error) {
    console.error('Saving player preferences:', error);
    $('preferences-status').textContent = 'Settings apply to this session only. Browser preferences could not be saved.';
    notice(`${error.message} Your settings work now, but could not be remembered for next time.`, true);
  }
}

for (const { id, label } of CONTROLS) {
  const row = document.createElement('div');
  row.className = 'key-binding';
  const name = document.createElement('span');
  name.textContent = label;
  const button = document.createElement('button');
  button.dataset.binding = id;
  button.addEventListener('click', () => {
    remappingAction = id;
    renderPreferences();
    $('key-status').textContent = `Press a new key for ${label}. Escape cancels.`;
  });
  row.append(name, button);
  $('key-bindings').append(row);
}

window.addEventListener('keydown', (event) => {
  if (!remappingAction || event.repeat) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.code === 'Escape') {
    remappingAction = null;
    renderPreferences();
    $('key-status').textContent = 'Key change cancelled.';
    return;
  }
  if (busy) {
    $('key-status').textContent = 'Wait for the current player action, then press your new key.';
    return;
  }
  try {
    if (event.ctrlKey || event.altKey || event.metaKey) throw new Error('Use a single key, not a browser shortcut.');
    const next = rebindControl(preferences, remappingAction, event.code);
    remappingAction = null;
    $('key-status').textContent = 'Key updated. Escape is reserved for the drawer.';
    void operation(() => applyPreferences(next));
  } catch (error) {
    $('key-status').textContent = error.message;
  }
}, true);

const keyboard = bindKeyboard(window, {
  enabled: (event) => running && (document.fullscreenElement === $('screen-focus') || (view?.mode === 'playing' && !view.transition)) && !$('tools').open && !$('help').open && !$('frame-host').open &&
    !event.target.closest?.('button, input, select, textarea, [contenteditable="true"]'),
  getBindings: () => preferences.controls,
  onInput: (action, pressed, code) => sendInput(action, pressed, `host-key:${code}`),
  onMenu: () => {
    if (document.fullscreenElement === $('screen-focus')) { closeScreenFullscreen(); return true; }
    if ($('tools').open || $('help').open || $('frame-host').open) return false;
    openTools();
    return true;
  },
});
window.addEventListener('blur', () => {
  for (const pointerId of [...pointers.keys()]) releasePointer({ pointerId });
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') releaseHostInputs();
});
$('reset-controls').addEventListener('click', () => {
  remappingAction = null;
  $('key-status').textContent = 'Default keys restored: Z = A, X = B.';
  void operation(() => applyPreferences({ ...preferences, controls: defaultPreferences().controls }));
});
$('volume').addEventListener('input', () => { $('volume-value').textContent = `${$('volume').value}%`; });
$('volume').addEventListener('change', () => void operation(() => applyPreferences({
  ...preferences, volume: Number($('volume').value),
})));
$('mute').addEventListener('click', () => void operation(() => applyPreferences({
  ...preferences, muted: !preferences.muted,
})));
$('shader').addEventListener('change', () => void operation(() => {
  const { shader: advancedShader, ...emulatorOptions } = preferences.emulatorOptions ?? {};
  return applyPreferences({ ...preferences, shader: $('shader').value, emulatorOptions });
}));

function changeView(mode) {
  releaseHostInputs();
  view?.setView(mode);
}
function toggleLamp() {
  if (!view) return;
  view.setLamp(!view.lampOn);
  $('lamp-toggle').setAttribute('aria-pressed', String(view.lampOn));
  $('lamp-toggle').setAttribute('aria-label', `Turn desk lamp ${view.lampOn ? 'off' : 'on'}`);
  icon($('lamp-toggle'), 'lamp', `Turn desk lamp ${view.lampOn ? 'off' : 'on'}`);
  view.canvas.focus({ preventScroll: true });
}
$('lamp-toggle').addEventListener('click', toggleLamp);
$('room-toggle').addEventListener('click', () => {
  if (!view) return;
  view.setRoomLights(!view.roomLightsOn);
  $('room-toggle').setAttribute('aria-pressed', String(view.roomLightsOn));
  $('room-toggle').setAttribute('aria-label', `Turn room lights ${view.roomLightsOn ? 'off' : 'on'}`);
  icon($('room-toggle'), 'room', `Turn room lights ${view.roomLightsOn ? 'off' : 'on'}`);
  view.canvas.focus({ preventScroll: true });
});
$('pickup').addEventListener('click', () => changeView('playing'));
$('inspect').addEventListener('click', () => changeView(view?.mode === 'inspecting' ? 'playing' : 'inspecting'));
$('put-down').addEventListener('click', () => changeView('table'));
await storageReady;
try {
  await loadBrand();
  view = new HandheldScene($('scene'), {
    onTools: openTools,
    onLamp: toggleLamp,
    onView: (mode, moving) => {
      releaseHostInputs();
      $('pickup').hidden = mode !== 'table';
      $('inspect').hidden = $('put-down').hidden = mode === 'table';
      for (const id of ['pickup', 'inspect', 'put-down']) $(id).disabled = moving;
      icon($('inspect'), mode === 'inspecting' ? 'back' : 'inspect', mode === 'inspecting' ? 'Back to play' : 'Inspect handheld');
      $('inspect').setAttribute('aria-pressed', String(mode === 'inspecting'));
      $('play-zoom-control').hidden = mode !== 'playing' || moving || document.fullscreenElement === $('screen-focus');
      $('scene-hint').textContent = mode === 'table' ? 'A quiet moment. Click the handheld to pick it up.' :
        mode === 'inspecting' ? 'Drag to look around. Scroll to zoom. Your game keeps running.' :
          'Yours for a little while. Z = A / X = B. Cartridges for keys, saves & settings.';
      if (running) void command('setInputEnabled', document.fullscreenElement === $('screen-focus') || (mode === 'playing' && !moving)).catch((error) => notice(error.message, true));
    },
    onError: (error) => { console.error('3D graphics:', error); notice(error.message, true); },
  });
  const wordmark = view.model.wordmark.image;
  wordmark.id = 'screen-focus-wordmark';
  wordmark.className = 'screen-focus-wordmark';
  wordmark.setAttribute('aria-hidden', 'true');
  $('screen-focus-wordmark').replaceWith(wordmark);
} catch (error) {
  console.error('Creating the 3D scene:', error);
  sceneFailure = new Error(`The 3D handheld needs WebGL 2 and could not start: ${error.message}`);
  $('scene-error').textContent = `${sceneFailure.message} Try a WebGL-enabled browser with hardware acceleration.`;
  $('scene-error').hidden = false;
  for (const id of ['pickup', 'inspect', 'put-down', 'lamp-toggle', 'room-toggle']) $(id).disabled = true;
}
$('scene').addEventListener('graphics-restored', () => notice('3D graphics recovered. Your cartridge session was retained.'));
renderPreferences();
if (preferenceWarning) {
  $('preferences-status').textContent = preferenceWarning;
  notice(preferenceWarning, true);
}
async function restoreConsole() {
  await storageReady;
  if (!storageAvailable) return;
  const device = await store.getDevice();
  powered = device.powered;
  updateControls();
  if (device.cartridge) {
    const file = new File([device.cartridge.bytes], device.cartridge.name);
    await loadRom(file, { remember: false });
  } else if (powered) {
    view?.showStatus('INSERT CARTRIDGE', 'ESC / CARTRIDGES & SETTINGS');
    $('empty-screen').textContent = 'Power on. Open Cartridges to insert a ROM.';
    $('power-label').textContent = 'POWER ON / INSERT CARTRIDGE';
  }
}
void restoreConsole().catch((error) => {
  console.error('Restoring console:', error);
  notice(`The console could not be restored: ${error.message}`, true);
}).finally(() => {
  busy = false;
  $('scene').dataset.ready = 'true';
  updateControls();
});
updateControls();
