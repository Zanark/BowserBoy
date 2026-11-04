import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CRT_GEOM, CRT_SHADERS, defaultPreferences, readPreferences, rebindControl, validateEmulatorOptions, validatePreferences, writePreferences } from '../../src/preferences.js';
import { bindKeyboard } from '../../src/keyboard.js';

test('remapping rejects duplicate and reserved keys without changing the existing mapping', () => {
  const original = defaultPreferences();
  assert.throws(() => rebindControl(original, 'a', 'KeyX'), /already assigned/);
  assert.throws(() => rebindControl(original, 'a', 'Escape'), /reserved/);
  assert.throws(() => rebindControl(original, 'other', 'KeyC'), /Unknown/);
  const changed = rebindControl(original, 'a', 'KeyC');
  assert.equal(changed.controls.a, 'KeyC');
  assert.equal(original.controls.a, 'KeyZ');
  assert.throws(() => validatePreferences({ ...changed, volume: 101 }), /invalid/);
  assert.throws(() => validatePreferences({ ...changed, muted: 'false' }), /invalid/);
});

test('preferences round-trip sound and remapping and propagate corrupt or blocked storage', () => {
  let stored = null;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  const preferences = { ...rebindControl(defaultPreferences(), 'b', 'KeyV'), volume: 23, muted: true };
  writePreferences(storage, preferences);
  assert.deepEqual(readPreferences(storage), preferences);
  stored = '{';
  assert.throws(() => readPreferences(storage), /could not be read/);
  assert.throws(() => writePreferences({ setItem() { throw new Error('Storage denied'); } }, preferences), /Storage denied/);
});

test('held keyboard input releases the original action after remapping and ignores repeats', () => {
  const target = new EventTarget();
  let bindings = { a: 'KeyZ' };
  const inputs = [];
  const keyboard = bindKeyboard(target, {
    enabled: () => true,
    getBindings: () => bindings,
    onInput: (...args) => inputs.push(args),
    onMenu: () => false,
  });

  const send = (type, code) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { code }));
  send('keydown', 'KeyZ');
  send('keydown', 'KeyZ');
  bindings = { b: 'KeyZ' };
  send('keyup', 'KeyZ');
  assert.deepEqual(inputs, [['a', true, 'KeyZ'], ['a', false, 'KeyZ']]);
  send('keydown', 'KeyZ');
  target.dispatchEvent(new Event('blur'));
  keyboard.release();
  assert.deepEqual(inputs.slice(2), [['b', true, 'KeyZ'], ['b', false, 'KeyZ']]);
});

test('older preferences gain CRT Geom without losing keys or sound, and filter choice round-trips', () => {
  const { shader, ...older } = { ...rebindControl(defaultPreferences(), 'a', 'KeyC'), volume: 31, muted: true };
  assert.deepEqual(validatePreferences(older), { ...older, shader: CRT_GEOM });
  let stored;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  for (const shader of ['disabled', ...CRT_SHADERS.map(option => option.value)]) {
    const preference = { ...older, shader };
    writePreferences(storage, preference);
    assert.deepEqual(readPreferences(storage), preference);
  }
  assert.throws(() => validatePreferences({ ...older, shader: 'not-a-shader' }), /supported CRT/);
});

test('native options survive preference updates without admitting managed controls or config injection', () => {
  const emulatorOptions = { shader: 'crt-aperture.glslp', 'ff-ratio': '2.0', rewindEnabled: 'enabled' };
  const preferences = { ...defaultPreferences(), emulatorOptions };
  let stored;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  writePreferences(storage, rebindControl(preferences, 'a', 'KeyC'));
  assert.deepEqual(readPreferences(storage).emulatorOptions, emulatorOptions);
  for (const invalid of [[], null, { keyboardInput: 'enabled' }, { shader: 2 },
    { foo: '"\nbar = 2' }, JSON.parse('{"__proto__":"bad"}')]) {
    assert.throws(() => validateEmulatorOptions(invalid), /invalid|managed/);
  }
});

test('autosave defaults on for legacy preferences and remembers an explicit off choice', () => {
  const { autoSave, ...legacy } = defaultPreferences();
  assert.equal(validatePreferences(legacy).autoSave, true);
  let stored;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  writePreferences(storage, { ...legacy, autoSave: false });
  assert.equal(readPreferences(storage).autoSave, false);
  assert.throws(() => validatePreferences({ ...legacy, autoSave: 'false' }), /checkpoint preference/);
  assert.throws(() => validatePreferences({ ...legacy, autoSave: null }), /checkpoint preference/);
});
