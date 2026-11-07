import { validateBatterySave, validateCapture } from './cartridge.js';
import { CONTROLS, MANAGED_SETTINGS, defaultPreferences, validateEmulatorOptions, validatePreferences, withFastForward } from './preferences.js';
import { bindKeyboard } from './keyboard.js';
import { configureAudioBuffer, protectAudio } from './audio.js';
import { DS_CONTROLS, DS_OPTIONS, dsScreenRegions, validateDsBattery, validateDsCapture } from './ds-cartridge.js';
import { DsTouchQueue } from './ds-touch.js';

// Version-specific internals are confined to this adapter; see docs/ARCHITECTURE.md.
const DATA_PATH = 'https://cdn.emulatorjs.org/4.2.3/data/';
let session;
let started = false;
let inputEnabled = true;
let settingsOpen = false;
let system = 'gba';
let controls = CONTROLS;
let touchDown = false;
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
  const control = controls.find(({ id }) => id === action);
  if ((!control && action !== 'fastForward') || typeof pressed !== 'boolean' || typeof source !== 'string' || source.length > 64) {
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
    if (action === 'fastForward') {
      preferences = withFastForward(preferences, isPressed);
      applySpeed();
      send('speed', { pressed: isPressed });
    } else {
      manager().simulateInput(0, control.button, isPressed ? 1 : 0);
      send('control', { action, pressed: isPressed });
    }
  }
}

const keyboard = bindKeyboard(window, {
  enabled: () => started && inputEnabled && !settingsOpen,
  getBindings: () => ({ ...Object.fromEntries(controls.map(({ id, code }) => [id, code])),
    ...(system === 'gba' ? preferences.controls : {}), fastForward: 'Space' }),
  onInput: (action, pressed, code) => input(action, pressed, `player-key:${code}`),
  onMenu: () => { send(settingsOpen ? 'settings-close' : 'tools'); return true; },
  blockUnmapped: true,
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    keyboard.release();
    if (system === 'ds') dsTouch.cancel();
  }
});

function configure(value) {
  const next = validatePreferences(value);
  if (system === 'ds') dsTouch.cancel();
  const wasFastForwardHeld = !!heldInputs.get('fastForward')?.size;
  keyboard.release();
  for (const [action, sources] of heldInputs) {
    for (const source of [...sources]) input(action, false, source);
  }
  preferences = wasFastForwardHeld ? withFastForward(next, false) : next;
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
  applySpeed();
}

function applySpeed() {
  const emulator = window.EJS_emulator;
  manager();
  for (const [option, fallback] of [['ff-ratio', '2.0'], ['fastForward', 'disabled'], ['slowMotion', 'disabled']]) {
    const value = preferences.emulatorOptions?.[option] ?? fallback;
    if (emulator.getSettingValue(option) !== value) emulator.changeSettingOption(option, value);
  }
  // Native VSync can re-cap the loop even while the fast-forward flag stays set.
  emulator.gameManager.setVSync(!emulator.isFastForward && emulator.getSettingValue('vsync') === 'enabled');
}

function warnVSync() {
  if (window.EJS_emulator.getSettingValue('vsync') === 'enabled') {
    send('notice', { error: true, message: 'VSync is enabled. Display-paced timing can cause audio crackling, stutter and dropouts. Disable VSync to restore audio-paced playback.' });
  }
}

function settings(open) {
  manager();
  if (typeof open !== 'boolean') throw new Error('Invalid settings panel mode.');
  const emulator = window.EJS_emulator;
  const menu = emulator.settingsMenu;
  if (!menu) throw new Error('The pinned runtime could not create its settings menu.');
  setInputEnabled(inputEnabled);
  const options = validateEmulatorOptions({ ...preferences.emulatorOptions, ...emulator.settings });
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
  if (open) warnVSync();
  return options;
}

function setInputEnabled(enabled) {
  if (typeof enabled !== 'boolean') throw new Error('Invalid handheld input mode.');
  keyboard.release();
  for (const [action, sources] of heldInputs) {
    for (const source of [...sources]) input(action, false, source);
  }
  inputEnabled = enabled;
  if (system === 'ds') dsTouch.cancel();
}

function capture() {
  const game = manager();
  return (system === 'ds' ? validateDsCapture : validateCapture)({
    state: game.getState(),
    sram: game.getSaveFile(),
  });
}

function loadBattery(sram) {
  (system === 'ds' ? validateDsBattery : validateBatterySave)(sram);
  if (sram === null) return;
  const game = manager();
  const path = game.getSaveFilePath();
  const directory = path.slice(0, path.lastIndexOf('/'));
  if (directory) game.mkdir(directory);
  game.FS.writeFile(path, sram);
  game.loadSaveFiles();
}

const renderedFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
async function dsInputFrame(current) {
  const frame = manager().getFrameNum();
  do {
    await new Promise(resolve => requestAnimationFrame(resolve));
  } while (current() && manager().getFrameNum() === frame);
}
const dsTouch = new DsTouchQueue({ dispatch: dispatchTouch, nextFrame: dsInputFrame, onError: fail });

async function restore(data) {
  (system === 'ds' ? validateDsCapture : validateCapture)(data);
  if (system === 'ds') dsTouch.cancel();
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
  if (data.system !== undefined && !['gba', 'ds'].includes(data.system)) throw new Error('Unsupported cartridge system.');
  system = data.system ?? 'gba';
  controls = system === 'ds' ? DS_CONTROLS : CONTROLS;
  preferences = validatePreferences(data.preferences ?? defaultPreferences());
  const battery = (system === 'ds' ? validateDsBattery : validateBatterySave)(data.battery);
  const romUrl = URL.createObjectURL(data.rom);
  Object.assign(window, {
    EJS_player: '#game',
    EJS_core: system === 'ds' ? 'desmume' : 'mgba',
    EJS_controlScheme: system === 'ds' ? 'nds' : 'gba',
    EJS_gameUrl: romUrl,
    EJS_gameName: `${system === 'ds' ? 'bowserboy-ds' : 'bba'}-${data.gameId}`,
    EJS_pathtodata: DATA_PATH,
    EJS_color: '#bd9cff',
    EJS_backgroundColor: '#15101f',
    EJS_startOnLoaded: false,
    EJS_threads: false,
    EJS_disableDatabases: true,
    EJS_disableLocalStorage: true,
    EJS_noAutoFocus: system === 'ds',
    EJS_disableAutoLang: false,
    EJS_language: 'en-US',
    EJS_volume: preferences.muted ? 0 : preferences.volume / 100,
    EJS_defaultOptions: {
      vsync: 'disabled',
      ...preferences.emulatorOptions,
      'virtual-gamepad': 'disabled',
      shader: preferences.emulatorOptions?.shader ?? preferences.shader,
      ...(system === 'ds' ? DS_OPTIONS : {}),
    },
    EJS_hideSettings: MANAGED_SETTINGS,
    EJS_defaultControls: {
      0: Object.fromEntries(controls.map(({ button, gamepad }) => [button, { value: '', value2: gamepad }])),
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
      configureAudioBuffer(window.EJS_GameManager);
      const getRetroArchCfg = window.EJS_GameManager.prototype.getRetroArchCfg;
      window.EJS_GameManager.prototype.getRetroArchCfg = function () {
        // Screen-sleep permission must not be a prerequisite for native gameplay.
        return `${getRetroArchCfg.call(this)}\nsuspend_screensaver_enable = false\n`;
      };
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
        const emulator = window.EJS_emulator;
        const changeSettingOption = emulator.changeSettingOption.bind(emulator);
        emulator.changeSettingOption = (option, ...values) => {
          const wasEnabled = option === 'vsync' && emulator.getSettingValue('vsync') === 'enabled';
          const result = changeSettingOption(option, ...values);
          if (option === 'vsync' && !wasEnabled) warnVSync();
          return result;
        };
        protectAudio(window.EJS_emulator);
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
        if (system === 'ds') {
          await renderedFrames();
          const width = manager().getVideoDimensions('width'), height = manager().getVideoDimensions('height');
          if (width !== 256 || height !== 384) throw new Error(`The DS core returned ${width}x${height}; expected native 256x384 top/bottom with no gap.`);
          dsScreenRegions(emulator.canvas.width, emulator.canvas.height);
        }
        send('started');
      } catch (error) { fail(error); }
    },
  });
  const script = document.createElement('script');
  script.src = `${DATA_PATH}loader.js`;
  script.onerror = () => fail(new Error('The emulator CDN could not be reached. Check your connection and try the ROM again.'));
  document.head.append(script);
}

function touch(value) {
  if (system !== 'ds' || !Number.isInteger(value?.x) || !Number.isInteger(value?.y) ||
      value.x < 0 || value.x > 255 || value.y < 0 || value.y > 191 || typeof value.pressed !== 'boolean' ||
      (value.cancelled !== undefined && (typeof value.cancelled !== 'boolean' || (value.cancelled && value.pressed)))) {
    throw new Error('Invalid DS stylus coordinates.');
  }
  if ((!inputEnabled || settingsOpen || window.EJS_emulator.paused) && value.pressed) return;
  if (value.cancelled) dsTouch.cancel();
  else dsTouch.push(value);
}

function dispatchTouch(value) {
  const canvas = window.EJS_emulator.canvas;
  dsScreenRegions(canvas.width, canvas.height);
  const bounds = canvas.getBoundingClientRect();
  const options = { bubbles: true, cancelable: true, button: 0, buttons: value.pressed ? 1 : 0,
    clientX: bounds.left + Math.max(1, (value.x + .5) / 256 * (bounds.width - 1)),
    clientY: bounds.top + Math.max(1, (value.y + 192 + .5) / 384 * (bounds.height - 1)) };
  // The browser driver's inclusive viewport marks its outer endpoints as offscreen.
  canvas.dispatchEvent(new MouseEvent('mousemove', options));
  if (touchDown !== value.pressed) canvas.dispatchEvent(new MouseEvent(value.pressed ? 'mousedown' : 'mouseup', options));
  touchDown = value.pressed;
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
  if (data?.type === 'bba:touch' && data.session === session && started) {
    try { touch(data.value); }
    catch (error) { fail(error); }
    return;
  }
  if (data?.type !== 'bba:command' || data.session !== session) return;
  try {
    let result;
    switch (data.command) {
      case 'capture': result = capture(); break;
      case 'battery': result = (system === 'ds' ? validateDsBattery : validateBatterySave)(manager().getSaveFile()); break;
      case 'restore': await restore(data.value); result = true; break;
      case 'configure': configure(data.value); result = true; break;
      case 'settings': result = settings(data.value); break;
      case 'setInputEnabled': setInputEnabled(data.value); result = true; break;
      case 'togglePause': {
        manager();
        if (system === 'ds') dsTouch.cancel();
        window.EJS_emulator.togglePlaying();
        result = window.EJS_emulator.paused;
        break;
      }
      case 'setPaused': {
        manager();
        if (typeof data.value !== 'boolean') throw new Error('Invalid pause mode.');
        if (system === 'ds') dsTouch.cancel();
        if (data.value) window.EJS_emulator.pause();
        else window.EJS_emulator.play();
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
