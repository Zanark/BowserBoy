export const RUNTIME = 'emulatorjs-4.2.3-mgba';
export const MAX_ROM_BYTES = 32 * 1024 * 1024;
export const MAX_STATE_BYTES = 16 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 24 * 1024 * 1024;

export async function digest(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function identifyRom(file) {
  if (!file || !/\.gba$/i.test(file.name)) {
    throw new Error('Choose an uncompressed .gba file. ZIP, Game Boy and Game Boy Color files are not supported yet.');
  }
  if (file.size < 192 || file.size > MAX_ROM_BYTES) {
    throw new Error('A GBA cartridge must be at least 192 bytes and no larger than 32 MB.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0xb2] !== 0x96) {
    throw new Error('This file does not have a GBA cartridge header. Choose a valid, uncompressed .gba ROM.');
  }
  return {
    id: await digest(bytes),
    title: file.name.replace(/\.gba$/i, '').replace(/[_]+/g, ' ').trim() || 'Untitled cartridge',
    fileName: file.name,
    size: file.size,
  };
}

export function latestSlot(record) {
  return [record?.automatic, record?.manual].filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

function fromBase64(value, maxLength) {
  if (typeof value !== 'string' || value.length > Math.ceil(maxLength / 3) * 4 ||
      value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('The backup contains invalid or oversized save data.');
  }
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export function validateBatterySave(sram) {
  if (!(sram === null || (sram instanceof Uint8Array && sram.byteLength <= 1024 * 1024))) {
    throw new Error('The emulator returned invalid battery-save data.');
  }
  return sram;
}

export function validateCapture(capture) {
  if (!(capture?.state instanceof Uint8Array) || capture.state.byteLength === 0 ||
      capture.state.byteLength > MAX_STATE_BYTES) {
    throw new Error('The emulator returned an invalid checkpoint.');
  }
  validateBatterySave(capture.sram);
  return capture;
}

export async function encodeBackup(game, capture) {
  validateCapture(capture);
  return JSON.stringify({
    format: 'bowser-boy-advance',
    version: 1,
    runtime: RUNTIME,
    rom: game.id,
    title: game.title,
    createdAt: new Date().toISOString(),
    state: toBase64(capture.state),
    stateHash: await digest(capture.state),
    sram: capture.sram === null ? null : toBase64(capture.sram),
    sramHash: capture.sram === null ? null : await digest(capture.sram),
  });
}

export async function decodeBackup(file, gameId) {
  if (file.size === 0 || file.size > MAX_BACKUP_BYTES) {
    throw new Error('The backup is empty or larger than the 24 MB limit.');
  }
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('This is not a readable .bba-save backup.');
  }
  if (!data || data.format !== 'bowser-boy-advance' || data.version !== 1 || data.runtime !== RUNTIME) {
    throw new Error('This backup is not compatible with this version of BowserBoyAdvance.');
  }
  if (data.rom !== gameId) {
    throw new Error('This backup belongs to a different ROM. Load the exact matching cartridge first.');
  }
  const capture = validateCapture({
    state: fromBase64(data.state, MAX_STATE_BYTES),
    sram: data.sram === null ? null : fromBase64(data.sram, 1024 * 1024),
  });
  if (await digest(capture.state) !== data.stateHash ||
      (capture.sram === null ? data.sramHash !== null : await digest(capture.sram) !== data.sramHash)) {
    throw new Error('The backup checksum failed. Its save data may be damaged.');
  }
  return capture;
}
