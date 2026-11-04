import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_ROM_BYTES, RUNTIME, decodeBackup, encodeBackup, identifyRom, latestSlot,
} from '../../src/cartridge.js';
import { createDemoRom } from '../../scripts/demo-rom.mjs';

const rom = (name = 'Pixel Lab.gba') => new File([createDemoRom()], name);
const checkpoint = { state: new Uint8Array([0, 1, 200, 255]), sram: new Uint8Array([17, 0, 42]) };
const backupFile = (data) => new File([typeof data === 'string' ? data : JSON.stringify(data)], 'session.bba-save');

test('ROM identity is content-based and survives renaming', async () => {
  const first = await identifyRom(rom());
  const renamed = await identifyRom(rom('Another_name.GBA'));
  assert.equal(first.id, renamed.id);
  assert.match(first.id, /^[a-f0-9]{64}$/);
  assert.equal(renamed.title, 'Another name');
  const otherBytes = createDemoRom();
  otherBytes[otherBytes.length - 1] = 1;
  assert.notEqual((await identifyRom(new File([otherBytes], 'other.gba'))).id, first.id);
});

test('invalid file types, sizes and fake GBA headers are rejected', async () => {
  await assert.rejects(identifyRom(rom('game.zip')), /uncompressed .gba/);
  await assert.rejects(identifyRom(new File([new Uint8Array(191)], 'small.gba')), /at least 192/);
  await assert.rejects(identifyRom({ name: 'large.gba', size: MAX_ROM_BYTES + 1 }), /32 MB/);
  await assert.rejects(identifyRom(new File([new Uint8Array(192)], 'fake.gba')), /header/);
});

test('portable checkpoint preserves binary state and SRAM including null SRAM', async () => {
  const game = await identifyRom(rom());
  for (const data of [checkpoint, { ...checkpoint, sram: null }]) {
    const restored = await decodeBackup(backupFile(await encodeBackup(game, data)), game.id);
    assert.deepEqual(restored, data);
  }
});

test('imports reject the wrong ROM, runtime, damaged binary and malformed backups', async () => {
  const game = await identifyRom(rom());
  const original = JSON.parse(await encodeBackup(game, checkpoint));
  await assert.rejects(decodeBackup(backupFile(original), '0'.repeat(64)), /different ROM/);
  await assert.rejects(decodeBackup(backupFile({ ...original, runtime: `${RUNTIME}-other` }), game.id), /compatible/);
  await assert.rejects(decodeBackup(backupFile({ ...original, state: 'AQ==' }), game.id), /checksum/);
  await assert.rejects(decodeBackup(backupFile({ ...original, sram: 'invalid!' }), game.id), /invalid/);
  await assert.rejects(decodeBackup(backupFile({ ...original, state: '' }), game.id), /invalid checkpoint/);
  await assert.rejects(decodeBackup(backupFile('not JSON'), game.id), /readable/);
  await assert.rejects(decodeBackup(backupFile('null'), game.id), /compatible/);
  await assert.rejects(decodeBackup({ size: 25 * 1024 * 1024 }, game.id), /24 MB/);
});

test('newest manual or automatic checkpoint is selected without assuming a slot exists', () => {
  assert.equal(latestSlot(null), null);
  const automatic = { createdAt: '2026-01-01T10:00:00.000Z' };
  const manual = { createdAt: '2026-01-01T11:00:00.000Z' };
  assert.equal(latestSlot({ automatic, manual }), manual);
  assert.equal(latestSlot({ automatic }), automatic);
  const manual2 = { createdAt: '2026-01-01T12:00:00.000Z' };
  const manual3 = { createdAt: '2026-01-01T13:00:00.000Z' };
  assert.equal(latestSlot({ automatic, manual, manual2 }), manual2);
  assert.equal(latestSlot({ automatic, manual, manual2, manual3 }), manual3);
});
