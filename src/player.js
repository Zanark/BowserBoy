import { validateCapture } from './cartridge.js';

// Version-specific internals are confined to this adapter; see docs/ARCHITECTURE.md.
const DATA_PATH = 'https://cdn.emulatorjs.org/4.2.3/data/';
let session;
let started = false;

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

function capture() {
  const game = manager();
  return validateCapture({
    state: game.getState(),
    sram: game.getSaveFile(),
  });
}

async function restore(data) {
  validateCapture(data);
  const game = manager();
  const emulator = window.EJS_emulator;
  const wasPaused = emulator.paused;
  emulator.play();
  try {
    if (data.sram !== null) {
      const path = game.getSaveFilePath();
      const directory = path.slice(0, path.lastIndexOf('/'));
      if (directory) game.mkdir(directory);
      game.FS.writeFile(path, data.sram);
      game.loadSaveFiles();
    }
    game.loadState(data.state);
    // Let the core render the restored state before acknowledging it or recapturing.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  } finally {
    if (wasPaused) emulator.pause();
  }
}

function initialize(data) {
  session = data.session;
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
    EJS_startOnLoaded: true,
    EJS_threads: false,
    EJS_disableDatabases: true,
    EJS_disableLocalStorage: true,
    EJS_disableAutoLang: false,
    EJS_language: 'en-US',
    EJS_volume: 0.6,
    EJS_defaultOptions: {
      'virtual-gamepad': navigator.maxTouchPoints > 0 ? 'enabled' : 'disabled',
    },
    EJS_defaultControls: {
      0: {
        0: { value: 'z', value2: 'BUTTON_2' },
        2: { value: 'shift', value2: 'SELECT' },
        3: { value: 'enter', value2: 'START' },
        4: { value: 'up arrow', value2: 'DPAD_UP' },
        5: { value: 'down arrow', value2: 'DPAD_DOWN' },
        6: { value: 'left arrow', value2: 'DPAD_LEFT' },
        7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
        8: { value: 'x', value2: 'BUTTON_1' },
        10: { value: 'a', value2: 'LEFT_TOP_SHOULDER' },
        11: { value: 's', value2: 'RIGHT_TOP_SHOULDER' },
      },
      1: {}, 2: {}, 3: {},
    },
    EJS_Buttons: {
      saveState: false, loadState: false, quickSave: false, quickLoad: false,
      saveSavFiles: false, loadSavFiles: false, cacheManager: false,
      cheat: false, screenRecord: false, exitEmulation: false,
    },
    EJS_ready: () => {
      const emulator = window.EJS_emulator;
      const originalError = emulator.startGameError.bind(emulator);
      emulator.startGameError = (message) => {
        send('failed', { message });
        originalError(message);
      };
      send('loading');
    },
    EJS_onGameStart: async () => {
      try {
        started = true;
        URL.revokeObjectURL(romUrl);
        if (data.restore) await restore(data.restore);
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
    initialize(data);
    return;
  }
  if (data?.type !== 'bba:command' || data.session !== session) return;
  try {
    let result;
    switch (data.command) {
      case 'capture': result = capture(); break;
      case 'restore': await restore(data.capture); result = true; break;
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
