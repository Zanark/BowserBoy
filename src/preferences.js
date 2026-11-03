export const PREFERENCES_KEY = 'bowser-boy-advance-preferences';
export const CRT_GEOM = 'crt-geom.glslp';
export const CONTROLS = [
  { id: 'up', label: 'Up', button: 4, code: 'ArrowUp', gamepad: 'DPAD_UP' },
  { id: 'down', label: 'Down', button: 5, code: 'ArrowDown', gamepad: 'DPAD_DOWN' },
  { id: 'left', label: 'Left', button: 6, code: 'ArrowLeft', gamepad: 'DPAD_LEFT' },
  { id: 'right', label: 'Right', button: 7, code: 'ArrowRight', gamepad: 'DPAD_RIGHT' },
  { id: 'a', label: 'A', button: 8, code: 'KeyZ', gamepad: 'BUTTON_1' },
  { id: 'b', label: 'B', button: 0, code: 'KeyX', gamepad: 'BUTTON_2' },
  { id: 'l', label: 'L', button: 10, code: 'KeyA', gamepad: 'LEFT_TOP_SHOULDER' },
  { id: 'r', label: 'R', button: 11, code: 'KeyS', gamepad: 'RIGHT_TOP_SHOULDER' },
  { id: 'start', label: 'Start', button: 3, code: 'Enter', gamepad: 'START' },
  { id: 'select', label: 'Select', button: 2, code: 'ShiftLeft', gamepad: 'SELECT' },
];

export function defaultPreferences() {
  return {
    version: 1,
    controls: Object.fromEntries(CONTROLS.map(({ id, code }) => [id, code])),
    volume: 60,
    muted: false,
    shader: CRT_GEOM,
  };
}

function validKey(code) {
  return typeof code === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Enter|Shift(Left|Right)|Backspace|Minus|Equal|Bracket(Left|Right)|Backslash|Semicolon|Quote|Comma|Period|Slash|Backquote|Numpad([0-9]|Add|Subtract|Multiply|Divide|Decimal|Enter))$/.test(code);
}

export function validatePreferences(value) {
  if (!value || value.version !== 1 || !value.controls ||
      typeof value.muted !== 'boolean' || !Number.isInteger(value.volume) ||
      value.volume < 0 || value.volume > 100) {
    throw new Error('Player preferences are invalid or from an unsupported version.');
  }
  const controls = {};
  const shader = value.shader === undefined ? CRT_GEOM : value.shader;
  if (![CRT_GEOM, 'disabled'].includes(shader)) throw new Error('Choose CRT Geom or an unfiltered display.');
  const assigned = new Set();
  for (const { id } of CONTROLS) {
    const code = value.controls[id];
    if (!validKey(code)) throw new Error('Choose a letter, number, arrow, Shift, Enter, Space or punctuation key. Escape and browser shortcuts are reserved.');
    if (assigned.has(code)) throw new Error('That key is already assigned. Choose a different key first.');
    assigned.add(code);
    controls[id] = code;
  }
  return { version: 1, controls, volume: value.volume, muted: value.muted, shader };
}

export function rebindControl(preferences, action, code) {
  if (!CONTROLS.some(({ id }) => id === action)) throw new Error('Unknown GBA control.');
  return validatePreferences({ ...preferences, controls: { ...preferences.controls, [action]: code } });
}

export function readPreferences(storage) {
  const stored = storage.getItem(PREFERENCES_KEY);
  if (stored === null) return defaultPreferences();
  try { return validatePreferences(JSON.parse(stored)); }
  catch (error) { throw new Error(`Saved player preferences could not be read: ${error.message}`); }
}

export function writePreferences(storage, preferences) {
  storage.setItem(PREFERENCES_KEY, JSON.stringify(validatePreferences(preferences)));
}

export function keyLabel(code) {
  const labels = {
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift', Space: 'Space',
    Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backquote: '`',
  };
  return labels[code] ?? code.replace(/^(Key|Digit)/, '').replace(/^Numpad/, 'Num ');
}
