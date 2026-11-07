import { digest } from './cartridge.js';
import { CONTROLS } from './preferences.js';

export const DS_RUNTIME = 'emulatorjs-4.2.3-desmume';
export const DS_MAX_ROM_BYTES = 512 * 1024 * 1024;
export const DS_MAX_STATE_BYTES = 64 * 1024 * 1024;
export const DS_CONTROLS = [
  ...CONTROLS.map(control => control.id === 'l' ? { ...control, code: 'KeyQ' }
    : control.id === 'r' ? { ...control, code: 'KeyW' } : control),
  { id: 'x', label: 'X', button: 9, code: 'KeyS', gamepad: 'BUTTON_4' },
  { id: 'y', label: 'Y', button: 1, code: 'KeyA', gamepad: 'BUTTON_3' },
];
export const DS_OPTIONS = Object.freeze({
  desmume_screens_layout: 'top/bottom',
  desmume_screens_gap: '0',
  desmume_internal_resolution: '256x192',
  desmume_pointer_mouse: 'enabled',
  desmume_pointer_type: 'touch',
  desmume_use_external_bios: 'disabled',
  desmume_boot_into_bios: 'disabled',
  desmume_num_cores: '1',
});

export async function identifyDsRom(file) {
  if (!file || !/\.nds$/i.test(file.name)) throw new Error('Choose an uncompressed Nintendo DS .nds file.');
  if (file.size < 512 || file.size > DS_MAX_ROM_BYTES) throw new Error('A DS ROM must be between 512 bytes and 512 MB.');
  const header = new DataView(await file.slice(0, 512).arrayBuffer());
  if (header.getUint8(0x12) !== 0) throw new Error('This prototype supports original Nintendo DS games, not DSi-enhanced or DSi-only ROMs.');
  for (const [offset, ranges] of [[0x20, [[0x02000000, 0x02400000]]], [0x30, [[0x02000000, 0x02400000], [0x037f8000, 0x03810000]]]]) {
    const romOffset = header.getUint32(offset, true);
    const entry = header.getUint32(offset + 4, true) & ~1;
    const address = header.getUint32(offset + 8, true);
    const size = header.getUint32(offset + 12, true);
    if (romOffset < 512 || !size || romOffset + size > file.size ||
        !ranges.some(([minimum, maximum]) => address >= minimum && address + size <= maximum) ||
        entry < address || entry >= address + size) {
      throw new Error('The DS cartridge header has invalid or truncated ARM program ranges. Choose a valid .nds ROM.');
    }
  }
  return {
    id: await digest(await file.arrayBuffer()),
    title: file.name.replace(/\.nds$/i, '').replace(/_+/g, ' ').trim() || 'Untitled DS cartridge',
    size: file.size,
    runtime: DS_RUNTIME,
  };
}

export function dsScreenRegions(width, height) {
  if (!Number.isInteger(width) || width < 256 || width > 2048 || width % 256 || height !== width * 1.5) {
    throw new Error(`The DS display returned ${width}x${height}; this prototype requires top/bottom 256x384 with no gap, or an integer-scaled display.`);
  }
  return [{ x: 0, y: 0, width, height: height / 2 }, { x: 0, y: height / 2, width, height: height / 2 }];
}

export function dsTouchFromUv(uv) {
  if (!uv || !Number.isFinite(uv.x) || !Number.isFinite(uv.y) ||
      uv.x < 0 || uv.x > 1 || uv.y < 0 || uv.y > 1) return null;
  return { x: Math.min(255, Math.floor(uv.x * 256)), y: Math.min(191, Math.floor((1 - uv.y) * 192)) };
}

export function validateDsCapture(value) {
  if (!(value?.state instanceof Uint8Array) || !value.state.length || value.state.length > DS_MAX_STATE_BYTES ||
      !(value.sram === null || (value.sram instanceof Uint8Array && value.sram.length <= 16 * 1024 * 1024))) {
    throw new Error('The DS core returned an invalid or oversized checkpoint.');
  }
  return value;
}

export function validateDsBattery(value) {
  if (!(value === null || (value instanceof Uint8Array && value.length <= 16 * 1024 * 1024))) {
    throw new Error('The DS core returned invalid in-game save data.');
  }
  return value;
}

const backupMagic = new TextEncoder().encode('BBDS0001');
export async function encodeDsBackup(rom, capture) {
  validateDsCapture(capture);
  const metadata = new TextEncoder().encode(JSON.stringify({
    runtime: DS_RUNTIME, rom, stateLength: capture.state.length,
    sramLength: capture.sram?.length ?? -1,
    stateHash: await digest(capture.state),
    sramHash: capture.sram === null ? null : await digest(capture.sram),
  }));
  const header = new Uint8Array(12);
  header.set(backupMagic);
  new DataView(header.buffer).setUint32(8, metadata.length, true);
  return new Blob([header, metadata, capture.state, capture.sram ?? new Uint8Array()]);
}

export async function decodeDsBackup(file, rom) {
  if (file.size < 12 || file.size > 80 * 1024 * 1024 + 4096) throw new Error('DS backup is empty or oversized.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!backupMagic.every((value, i) => value === bytes[i])) throw new Error('Choose a BowserBoy DS .bbds-save backup, not a GBA backup or raw save.');
  const length = new DataView(bytes.buffer).getUint32(8, true);
  if (length > 4096 || 12 + length > bytes.length) throw new Error('DS backup metadata is damaged.');
  let metadata;
  try { metadata = JSON.parse(new TextDecoder().decode(bytes.subarray(12, 12 + length))); }
  catch { throw new Error('DS backup metadata is not readable.'); }
  if (!metadata || metadata.runtime !== DS_RUNTIME || metadata.rom !== rom) throw new Error('This DS backup needs the exact matching ROM and DeSmuME runtime.');
  if (!Number.isInteger(metadata.stateLength) || metadata.stateLength < 1 ||
      !Number.isInteger(metadata.sramLength) || metadata.sramLength < -1 ||
      12 + length + metadata.stateLength + Math.max(0, metadata.sramLength) !== bytes.length) {
    throw new Error('DS backup data lengths are damaged.');
  }
  const capture = validateDsCapture({
    state: bytes.slice(12 + length, 12 + length + metadata.stateLength),
    sram: metadata.sramLength === -1 ? null : bytes.slice(12 + length + metadata.stateLength),
  });
  if (await digest(capture.state) !== metadata.stateHash ||
      (capture.sram === null ? metadata.sramHash !== null : await digest(capture.sram) !== metadata.sramHash)) {
    throw new Error('DS backup checksum failed.');
  }
  return capture;
}
