import assert from 'node:assert/strict';
import { test } from 'node:test';
import { identifyDsRom, dsScreenRegions, dsTouchFromUv, encodeDsBackup, decodeDsBackup } from '../../src/ds-cartridge.js';
import { createDsDemoRom } from '../../scripts/demo-ds-rom.mjs';
import { createDemoRom } from '../../scripts/demo-rom.mjs';

test('DS identity survives rename, while rejecting GBA, DSi and truncated CPU ranges', async () => {
  const bytes = createDsDemoRom();
  const first = await identifyDsRom(new File([bytes], 'Twin Lab.nds'));
  assert.equal(first.id, (await identifyDsRom(new File([bytes], 'renamed.NDS'))).id);
  await assert.rejects(identifyDsRom(new File([createDemoRom()], 'Pixel Lab.nds')), /header/);
  await assert.rejects(identifyDsRom(new File([bytes], 'Twin Lab.gba')), /uncompressed/);
  bytes[0x12] = 2;
  await assert.rejects(identifyDsRom(new File([bytes], 'dsi.nds')), /DSi/);
  bytes[0x12] = 0;
  new DataView(bytes.buffer).setUint32(0x2c, bytes.length, true);
  await assert.rejects(identifyDsRom(new File([bytes], 'truncated.nds')), /ranges/);
});

test('screen split and lower-screen UV mapping preserve orientation and reject unsupported layouts', () => {
  assert.deepEqual(dsScreenRegions(256, 384).map(({ y, height }) => [y, height]), [[0, 192], [192, 192]]);
  assert.deepEqual(dsScreenRegions(512, 768).map(({ y, height }) => [y, height]), [[0, 384], [384, 384]]);
  assert.throws(() => dsScreenRegions(512, 192), /requires top\/bottom/);
  assert.deepEqual(dsTouchFromUv({ x: 0, y: 1 }), { x: 0, y: 0 });
  assert.deepEqual(dsTouchFromUv({ x: 1, y: 0 }), { x: 255, y: 191 });
  assert.deepEqual(dsTouchFromUv({ x: .5, y: .5 }), { x: 128, y: 96 });
  for (const uv of [undefined, { x: -1, y: 0 }, { x: 1, y: Infinity }, { x: NaN, y: 1 }]) assert.equal(dsTouchFromUv(uv), null);
});

test('DS backups preserve binary state, reject wrong identities, tampering and malformed metadata', async () => {
  const rom = (await identifyDsRom(new File([createDsDemoRom()], 'Twin Lab.nds'))).id;
  for (const sram of [null, new Uint8Array(), new Uint8Array([0, 255, 17])]) {
    const capture = { state: new Uint8Array([1, 128, 255, 42]), sram };
    const blob = await encodeDsBackup(rom, capture);
    assert.deepEqual(await decodeDsBackup(blob, rom), capture);
    await assert.rejects(decodeDsBackup(blob, 'a'.repeat(64)), /matching ROM/);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    bytes[bytes.length - 1] ^= 1;
    await assert.rejects(decodeDsBackup(new Blob([bytes]), rom), /checksum/);
  }
  await assert.rejects(decodeDsBackup(new Blob(['not a ds backup']), rom), /GBA backup/);
  const header = new Uint8Array(16);
  header.set(new TextEncoder().encode('BBDS0001'));
  new DataView(header.buffer).setUint32(8, 4, true);
  header.set(new TextEncoder().encode('null'), 12);
  await assert.rejects(decodeDsBackup(new Blob([header]), rom), /matching ROM/);
});
