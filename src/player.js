import { validateBatterySave, validateCapture } from './cartridge.js';
import { CONTROLS, MANAGED_SETTINGS, defaultPreferences, validateEmulatorOptions, validatePreferences } from './preferences.js';
import { bindKeyboard } from './keyboard.js';

// Version-specific internals are confined to this adapter; see docs/ARCHITECTURE.md.
const DATA_PATH = 'https://cdn.emulatorjs.org/4.2.3/data/';
let session;
let started = false;
let inputEnabled = true;
let settingsOpen = false;
let preferences = defaultPreferences();
const heldInputs = new Map();

// The host owns exit handling. Upstream resets the core even if navigation is cancelled.
window.addEventListener('beforeunload', (event) => event.stopImmediatePropagation(), true);

function send(type, data = {}) {
  parent.postMessage({ type: `bba:${type}`, session, ...data }, location.origin);
}

function fail(error) {
  console.error('Cartridge player:', error);
  send('failed', { message: error instanceof Error ? error.message : String(error) });
}

function manager() {
  if (!started || !window.EJS_emulator?.gameManager) throw new Error('The cartridge is not running yet.');
  return window.EJS_emulator.gameManager;
}

function input(action, pressed, source) {
  const control = CONTROLS.find(({ id }) => id === action);
  if (!control || typeof pressed !== 'boolean' || typeof source !== 'string' || source.length > 64) {
    throw new Error('Invalid console input.');
  }
  if ((!inputEnabled || settingsOpen) && pressed) return;
  const sources = heldInputs.get(action) ?? new Set();
  const wasPressed = sources.size > 0;
  if (pressed) sources.add(source);
  else sources.delete(source);
  heldInputs.set(action, sources);
  const isPressed = sources.size > 0;
  if (wasPressed !== isPressed) {
    manager().simulateInput(0, control.button, isPressed ? 1 : 0);
    send('control', { action, pressed: isPressed });
  }
}

const keyboard = bindKeyboard(window, {
  enabled: () => started && inputEnabled && !settingsOpen,
  getBindings: () => preferences.controls,
  onInput: (action, pressed, code) => input(action, pressed, `player-key:${code}`),
  onMenu: () => { send(settingsOpen ? 'settings-close' : 'tools'); return true; },
  blockUnmapped: true,
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') keyboard.release();
});

function configure(value) {
  const next = validatePreferences(value);
  keyboard.release();
  for (const [action, sources] of heldInputs) {
    for (const source of [...sources]) input(action, false, source);
  }
  preferences = next;
  const emulator = window.EJS_emulator;
  emulator.volume = preferences.muted ? 0 : preferences.volume / 100;
  emulator.setVolume(emulator.volume);
  const shader = preferences.emulatorOptions?.shader ?? preferences.shader;
  if (shader !== 'disabled' && !emulator.config.shaders?.[shader]) {
    throw new Error('The pinned runtime did not provide the selected shader. Reload to retry the runtime download.');
  }
  if (emulator.getSettingValue('shader') !== shader) {
    emulator.changeSettingOption('shader', shader);
  }
}

function settings(open) {
  manager();
  if (typeof open !== 'boolean') throw new Error('Invalid settings panel mode.');
  const emulator = window.EJS_emulator;
  const menu = emulator.settingsMenu;
  if (!menu) throw new Error('The pinned runtime could not create its settings menu.');
  const options = validateEmulatorOptions({ ...preferences.emulatorOptions, ...emulator.settings });
  setInputEnabled(inputEnabled);
  settingsOpen = open;
  emulator.settingsMenuOpen = open;
  document.body.classList.toggle('native-settings', open);
  // Move only the menu, never the running iframe or its canvas.
  if (open) emulator.elements.parent.append(menu);
  menu.style.display = open ? '' : 'none';
  for (const row of menu.querySelectorAll('.ejs_settings_main_bar')) {
    if (['Input Options', 'Save States', 'Virtual Gamepad'].includes(row.textContent)) {
      row.remove();
      continue;
    }
    if (row.hasAttribute('tabindex')) continue;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.addEventListener('keydown', (event) => {
      if (event.code !== 'Enter' && event.code !== 'Space') return;
      event.preventDefault();
      row.click();
    });
  }
  return options;
}

function setInputEnabled(enabled) {
  if (typeof enabled !== 'boolean') throw new Error('Invalid handheld input mode.');
  keyboard.release();
  for (const [action, sources] of heldInputs) {
    for (const source of [...sources]) input(action, false, source);
  }
  inputEnabled = enabled;
}

function capture() {
  const game = manager();
  return validateCapture({
    state: game.getState(),
    sram: game.getSaveFile(),
  });
}

function loadBattery(sram) {
  validateBatterySave(sram);
  if (sram === null) return;
  const game = manager();
  const path = game.getSaveFilePath();
  const directory = path.slice(0, path.lastIndexOf('/'));
  if (directory) game.mkdir(directory);
  game.FS.writeFile(path, sram);
  game.loadSaveFiles();
}

const renderedFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function restore(data) {
  validateCapture(data);
  const game = manager();
  const emulator = window.EJS_emulator;
  const wasPaused = emulator.paused;
  emulator.play();
  try {
    loadBattery(data.sram);
    game.loadState(data.state);
    // Let the core render the restored state before acknowledging it or recapturing.
    await renderedFrames();
  } finally {
    if (wasPaused) emulator.pause();
  }
}

function initialize(data) {
  session = data.session;
  preferences = validatePreferences(data.preferences ?? defaultPreferences());
  const battery = validateBatterySave(data.battery);
  const romUrl = URL.createObjectURL(data.rom);
  Object.assign(window, {
    EJS_player: '#game',
    EJS_core: 'mgba',
    EJS_controlScheme: 'gba',
    EJS_gameUrl: romUrl,
    EJS_gameName: `bba-${data.gameId}`,
    EJS_pathtodata: DATA_PATH,
    EJS_color: '#c6f36b',
    EJS_backgroundColor: '#111713',
    EJS_startOnLoaded: false,
    EJS_threads: false,
    EJS_disableDatabases: true,
    EJS_disableLocalStorage: true,
    EJS_disableAutoLang: false,
    EJS_language: 'en-US',
    EJS_volume: preferences.muted ? 0 : preferences.volume / 100,
    EJS_defaultOptions: {
      ...preferences.emulatorOptions,
      'virtual-gamepad': 'disabled',
      shader: preferences.emulatorOptions?.shader ?? preferences.shader,
    },
    EJS_hideSettings: MANAGED_SETTINGS,
    EJS_defaultControls: {
      0: Object.fromEntries(CONTROLS.map(({ button, gamepad }) => [button, { value: '', value2: gamepad }])),
      1: {}, 2: {}, 3: {},
    },
    EJS_Buttons: {
      saveState: false, loadState: false, quickSave: false, quickLoad: false,
      saveSavFiles: false, loadSavFiles: false, cacheManager: false,
      cheat: false, screenRecord: false, exitEmulation: false,
      rightClick: false,
    },
    EJS_ready: () => {
      const emulator = window.EJS_emulator;
      // Only this core's canvas retains its post-shader framebuffer for the 3D LCD.
      const getContext = emulator.canvas.getContext.bind(emulator.canvas);
      emulator.canvas.getContext = (type, options) => getContext(type,
        /^(webgl2?|experimental-webgl)$/.test(type) ? { ...options, preserveDrawingBuffer: true } : options);
      const originalError = emulator.startGameError.bind(emulator);
      emulator.startGameError = (message) => {
        send('failed', { message });
        originalError(message);
      };
      send('loading');
      const start = document.querySelector('.ejs_start_button');
      if (!start) { fail(new Error('The pinned emulator could not create its start control.')); return; }
      start.click();
    },
    EJS_onGameStart: async () => {
      try {
        started = true;
        window.EJS_emulator.canvas.dataset.bbaDisplay = 'true';
        configure(preferences);
        URL.revokeObjectURL(romUrl);
        if (data.restore) await restore(data.restore);
        else if (battery !== null) {
          loadBattery(battery);
          manager().restart();
          await renderedFrames();
        }
        // The upstream drop handler accepts arbitrary raw states. Keep imports validated by the host.
        document.addEventListener('drop', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          send('notice', { message: 'Use Choose a ROM to switch games, or Import backup to restore a .bba-save file.' });
        }, true);
        send('started');
      } catch (error) { fail(error); }
    },
  });
  const script = document.createElement('script');
  script.src = `${DATA_PATH}loader.js`;
  script.onerror = () => fail(new Error('The emulator CDN could not be reached. Check your connection and try the ROM again.'));
  document.head.append(script);
}

window.addEventListener('message', async (event) => {
  if (event.source !== parent || event.origin !== location.origin) return;
  const data = event.data;
  if (data?.type === 'bba:init' && !session && typeof data.session === 'string' &&
      data.rom instanceof Blob && /^[a-f0-9]{64}$/.test(data.gameId)) {
    try { initialize(data); }
    catch (error) { fail(error); }
    return;
  }
  if (data?.type === 'bba:input' && data.session === session && started) {
    try { input(data.action, data.pressed, data.source); }
    catch (error) { fail(error); }
    return;
  }
  if (data?.type !== 'bba:command' || data.session !== session) return;
  try {
    let result;
    switch (data.command) {
      case 'capture': result = capture(); break;
      case 'battery': result = validateBatterySave(manager().getSaveFile()); break;
      case 'restore': await restore(data.value); result = true; break;
      case 'configure': configure(data.value); result = true; break;
      case 'settings': result = settings(data.value); break;
      case 'setInputEnabled': setInputEnabled(data.value); result = true; break;
      case 'togglePause': {
        manager();
        window.EJS_emulator.togglePlaying();
        result = window.EJS_emulator.paused;
        break;
      }
      default: throw new Error('Unknown player command.');
    }
    send('result', { requestId: data.requestId, result });
  } catch (error) {
    console.error('Player command failed:', error);
    send('result', { requestId: data.requestId, error: error.message });
  }
});

window.addEventListener('error', (event) => {
  if (session && event.error) fail(event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  if (session) fail(event.reason);
});
