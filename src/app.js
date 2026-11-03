import { RUNTIME, decodeBackup, encodeBackup, identifyRom, latestSlot } from './cartridge.js';
import { SaveStore } from './save-store.js';

const $ = (id) => document.getElementById(id);
const store = new SaveStore();
let game = null;
let record = null;
let frame = null;
let session = null;
let running = false;
let busy = false;
let storageAvailable = false;
let autoSave = true;
let launchCallbacks = null;
const pending = new Map();

function notice(message, error = false) {
  $('notice-text').textContent = message;
  $('notice').classList.toggle('error', error);
  $('notice').hidden = false;
}

function storageFailure(error) {
  console.error('Browser progress storage:', error);
  autoSave = false;
  $('autosave-toggle').setAttribute('aria-pressed', 'false');
  $('autosave-description').textContent = 'Off. Export a backup to protect this session.';
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
  for (const id of ['upload', 'screen-upload', 'rom-file', 'demo']) $(id).disabled = busy;
  for (const id of ['pause', 'fullscreen', 'export', 'import']) $(id).disabled = !running || busy;
  $('save').disabled = !running || busy || !storageAvailable;
  $('restore').disabled = !running || busy || !record?.manual;
  $('autosave-toggle').disabled = !storageAvailable || busy;
  $('power-led').classList.toggle('on', running);
  if (record?.manual) $('quick-save-time').textContent = new Date(record.manual.createdAt).toLocaleString();
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

function command(name, capture) {
  if (!running || !frame) return Promise.reject(new Error('Load a cartridge before using player controls.'));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error('The emulator did not respond. Your previous browser checkpoints are still available.'));
    }, 10000);
    pending.set(requestId, { resolve, reject, timer });
    frame.contentWindow.postMessage({
      type: 'bba:command', session, requestId, command: name, capture,
    }, location.origin);
  });
}

function clearPlayer() {
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
  $('pause').textContent = '\u275a\u275a';
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

function launch(file, restore) {
  clearPlayer();
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
  frame.src = new URL('./player.html', document.baseURI).href;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      launchCallbacks?.reject(new Error('The emulator did not start within 90 seconds. Check your internet connection, then choose the ROM again.'));
    }, 90000);
    launchCallbacks = {
      resolve: () => { clearTimeout(timer); launchCallbacks = null; resolve(); },
      reject: (error) => { clearTimeout(timer); launchCallbacks = null; reject(error); },
    };
    frame.addEventListener('load', () => {
      frame.contentWindow.postMessage({
        type: 'bba:init', session, rom: file, gameId: game.id, restore,
      }, location.origin);
    }, { once: true });
    $('frame-host').replaceChildren(frame);
  }).catch((error) => {
    clearPlayer();
    $('loading-screen').hidden = true;
    $('empty-screen').hidden = false;
    $('power-label').textContent = 'CHOOSE A CARTRIDGE TO RETRY';
    throw error;
  });
}

async function loadRom(file) {
  const identified = await identifyRom(file);
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
  game = identified;
  record = saved;
  $('game-title').textContent = game.title;
  const size = game.size < 1024 * 1024 ? `${Math.ceil(game.size / 1024)} KB` : `${(game.size / 1024 / 1024).toFixed(2)} MB`;
  $('game-meta').textContent = `GAME BOY ADVANCE / ${size} / LOCAL CARTRIDGE`;
  $('game-monogram').textContent = game.title.slice(0, 1).toUpperCase();
  $('quick-save-time').textContent = record?.manual ? new Date(record.manual.createdAt).toLocaleString() : 'Your safety net for the tricky bits.';
  const checkpoint = latestSlot(record);
  await launch(file, checkpoint);
  if (storageAvailable && !$('storage-badge').classList.contains('error')) {
    $('storage-badge').textContent = checkpoint ? 'RESUMED' : 'LOCAL ONLY';
    $('save-status').textContent = checkpoint ? 'Checkpoint restored. Progress is local to this browser; export a backup regularly.' :
      'No checkpoint for this cartridge yet. Save in this browser or export a portable backup.';
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
      running = true;
      $('loading-screen').hidden = true;
      $('power-label').textContent = 'CARTRIDGE IN / GOOD TIMES ON';
      launchCallbacks?.resolve();
      updateControls();
      frame.focus();
      break;
    case 'bba:failed':
      if (launchCallbacks) launchCallbacks.reject(new Error(data.message));
      else notice(`Emulator error: ${data.message}`, true);
      break;
    case 'bba:notice': notice(data.message); break;
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

for (const id of ['upload', 'screen-upload']) $(id).addEventListener('click', () => $('rom-file').click());
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
$('pause').addEventListener('click', () => void operation(async () => {
  const paused = await command('togglePause');
  $('pause').setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
  $('pause').title = paused ? 'Resume game' : 'Pause game';
  $('pause').textContent = paused ? '\u25b6' : '\u275a\u275a';
  $('power-label').textContent = paused ? 'TAKE YOUR TIME / GAME PAUSED' : 'CARTRIDGE IN / GOOD TIMES ON';
}));
$('fullscreen').addEventListener('click', () => {
  const action = document.fullscreenElement ? document.exitFullscreen() : $('player').requestFullscreen?.();
  if (!action) { notice('Fullscreen is not supported here. Try rotating your device for a larger view.'); return; }
  void action.catch((error) => notice(`Fullscreen could not open: ${error.message}`, true));
});
$('save').addEventListener('click', () => void operation(async () => {
  await persist('manual');
  notice('Checkpoint saved. You can restore this quick-save slot whenever you need it.');
}));
$('restore').addEventListener('click', () => void operation(async () => {
  if (!record?.manual) throw new Error('There is no quick-save checkpoint for this cartridge yet.');
  if (!confirm('Restore the quick-save checkpoint? Progress since that checkpoint will be replaced.')) return;
  await command('restore', record.manual);
  if (autoSave && storageAvailable) await persist('automatic');
  notice('Quick-save checkpoint restored.');
}));
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
    if (!confirm('Import this backup? It replaces the running session and this cartridge\'s quick-save slot.')) return;
    if (storageAvailable) await persist('manual', capture);
    await command('restore', capture);
    if (autoSave && storageAvailable) await persist('automatic');
    notice(storageAvailable ? 'Backup imported and stored in this browser.' : 'Backup loaded for this session only. Browser saving is unavailable.', !storageAvailable);
  });
});
$('autosave-toggle').addEventListener('click', () => {
  autoSave = !autoSave;
  $('autosave-toggle').setAttribute('aria-pressed', String(autoSave));
  $('autosave-description').textContent = autoSave ? 'A checkpoint every 15 seconds.' : 'Off. Use Save checkpoint before leaving.';
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
void storageReady.then(updateControls);
updateControls();
