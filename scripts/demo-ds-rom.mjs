// Original dual-CPU DS homebrew. No Nintendo logo, BIOS, firmware or game bytes.
function assembler() {
  const words = [], labels = new Map(), branches = [], literals = [];
  const emit = word => words.push(word >>> 0);
  const imm = value => {
    for (let rotation = 0; rotation < 16; rotation++) {
      const shift = rotation * 2;
      const byte = ((value << shift) | (value >>> (32 - shift))) >>> 0;
      if (byte <= 255) return rotation << 8 | byte;
    }
    throw new Error(`Unencodable DS ARM immediate: ${value}`);
  };
  const mov = (reg, value, condition = 14) => emit(condition << 28 | 0x03a00000 | reg << 12 | imm(value));
  const add = (reg, value, condition = 14) => emit(condition << 28 | 0x02800000 | reg << 16 | reg << 12 | imm(value));
  const sub = (reg, value, condition = 14) => emit(condition << 28 | 0x02400000 | reg << 16 | reg << 12 | imm(value));
  const cmp = (reg, value) => emit(0xe3500000 | reg << 16 | imm(value));
  const test = (reg, value) => emit(0xe3100000 | reg << 16 | imm(value));
  const literal = (reg, value, condition = 14) => { literals.push({ index: words.length, reg, value, condition }); emit(0); };
  const label = name => labels.set(name, words.length);
  const branch = (target, condition = 14) => { branches.push({ index: words.length, target, condition }); emit(0); };
  const half = (load, reg, base, offset = 0) => emit((load ? 0xe1d000b0 : 0xe1c000b0) | base << 16 | reg << 12 | (offset & 0xf0) << 4 | offset & 15);
  const finish = () => {
    for (const { index, target, condition } of branches) {
      if (!labels.has(target)) throw new Error(`Missing DS ARM label: ${target}`);
      words[index] = (condition << 28 | 0x0a000000 | (labels.get(target) - index - 2) & 0xffffff) >>> 0;
    }
    for (const { index, reg, value, condition } of literals) {
      const offset = (words.length - index - 2) * 4;
      if (offset > 4095) throw new Error('DS literal pool is out of range.');
      words[index] = (condition << 28 | 0x059f0000 | reg << 12 | offset) >>> 0;
      emit(value);
    }
    const bytes = new Uint8Array(words.length * 4), view = new DataView(bytes.buffer);
    words.forEach((word, i) => view.setUint32(i * 4, word, true));
    return bytes;
  };
  return { emit, mov, add, sub, cmp, test, literal, label, branch, half, finish };
}

function arm9Program() {
  const { emit, mov, add, sub, cmp, test, literal, label, branch, half, finish } = assembler();
  literal(0, 0x04000304); literal(1, 0x820f); half(false, 1, 0);
  literal(0, 0x04000240); mov(1, 0x80); emit(0xe5c01000);
  mov(1, 0x84); emit(0xe5c01002);
  literal(0, 0x04000000); literal(1, 0x00020000); emit(0xe5801000);
  literal(0, 0x04001000); literal(1, 0x00010805); emit(0xe5801000);
  literal(1, 0x4084); half(false, 1, 0, 0x0e);
  mov(1, 256); half(false, 1, 0, 0x30); half(false, 1, 0, 0x36);
  for (const [name, source, target] of [['top', 0x02001000, 0x06800000], ['bottom', 0x02019000, 0x06200000]]) {
    literal(0, source); literal(1, target); literal(3, 24576);
    label(`copy-${name}`); emit(0xe4902004); emit(0xe4812004); emit(0xe2533001); branch(`copy-${name}`, 1);
  }
  literal(12, 0x023ff000); mov(4, 120); mov(5, 95);
  emit(0xe58c4010); emit(0xe58c5014);
  literal(11, 0x04000130);
  const square = name => {
    emit(0xe1a07485); emit(0xe0877084); emit(0xe087700a);
    mov(8, 8); label(`${name}-row`); mov(9, 8); label(`${name}-pixel`);
    emit(0xe0c730b2); emit(0xe2599001); branch(`${name}-pixel`, 1);
    add(7, 496); emit(0xe2588001); branch(`${name}-row`, 1);
  };
  label('frame');
  literal(0, 0x04000006);
  label('visible'); half(true, 1, 0); cmp(1, 192); branch('visible', 11);
  label('blank'); half(true, 1, 0); cmp(1, 192); branch('blank', 10);
  emit(0xe59c4010); emit(0xe59c5014);
  literal(10, 0x06800000); literal(3, 0x8c42); square('erase');
  half(true, 6, 11);
  test(6, 32); sub(4, 2, 0); test(6, 16); add(4, 2, 0);
  test(6, 64); sub(5, 2, 0); test(6, 128); add(5, 2, 0);
  cmp(4, 12); mov(4, 12, 11); cmp(4, 236); mov(4, 236, 12);
  cmp(5, 75); mov(5, 75, 11); cmp(5, 140); mov(5, 140, 12);
  emit(0xe58c4010); emit(0xe58c5014);
  literal(3, 0x9b5b); test(6, 1); literal(3, 0x83ff, 0);
  emit(0xe59c100c); test(1, 1); literal(3, 0xfc1f, 0);
  square('top-marker');
  emit(0xe59c1000); cmp(1, 0); branch('frame', 0);
  emit(0xe59c4004); emit(0xe1a04224);
  emit(0xe59c1008); mov(5, 11);
  label('divide-y'); cmp(1, 24); branch('divide-done', 11); sub(1, 24); add(5, 1); branch('divide-y');
  label('divide-done');
  cmp(4, 8); mov(4, 8, 11); cmp(4, 240); mov(4, 240, 12);
  cmp(5, 65); mov(5, 65, 11); cmp(5, 176); mov(5, 176, 12);
  literal(10, 0x06200000); literal(3, 0x83ff); square('stylus');
  branch('frame');
  return finish();
}

function arm7Program() {
  const { emit, mov, cmp, test, literal, label, branch, half, finish } = assembler();
  literal(10, 0x040001c0); literal(11, 0x023ff000); literal(12, 0x04000136);
  mov(0, 0); emit(0xe58b0000);
  const wait = name => { label(name); half(true, 1, 10); test(1, 128); branch(name, 1); };
  label('poll');
  half(true, 0, 12); emit(0xe58b000c); test(0, 64);
  branch('touch', 0);
  mov(0, 0); emit(0xe58b0000); branch('next');
  label('touch');
  for (const [name, command, offset] of [['x', 0xd0, 4], ['y', 0x90, 8]]) {
    literal(0, 0x8a01); half(false, 0, 10);
    mov(0, command); half(false, 0, 10, 2); wait(`${name}-command`);
    mov(0, 0); half(false, 0, 10, 2); wait(`${name}-high`);
    half(true, 2, 10, 2); emit(0xe1a02282);
    literal(0, 0x8201); half(false, 0, 10);
    mov(0, 0); half(false, 0, 10, 2); wait(`${name}-low`);
    half(true, 3, 10, 2); emit(0xe18221a3); emit(0xe58b2000 | offset);
    mov(0, 0); half(false, 0, 10);
  }
  mov(0, 1); emit(0xe58b0000);
  label('next'); literal(4, 0x04000006);
  label('visible'); half(true, 0, 4); cmp(0, 192); branch('visible', 11);
  label('blank'); half(true, 0, 4); cmp(0, 192); branch('blank', 10);
  branch('poll');
  return finish();
}

const glyphs = {
  A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01111/10000/10000/10000/10000/10000/01111', D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01111/10000/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001',
  I: '111/010/010/010/010/010/111', J: '00111/00010/00010/00010/10010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110', P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101', R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110', V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/11011/10001', X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100', Z: '11111/00001/00010/00100/01000/10000/11111',
  '/': '00001/00010/00100/01000/10000/00000/00000',
};

function framebuffer(bottom) {
  const bytes = new Uint8Array(256 * 192 * 2), view = new DataView(bytes.buffer);
  const pixel = (x, y, color) => view.setUint16((y * 256 + x) * 2, color, true);
  const bg = bottom ? 0x9541 : 0x8c42;
  for (let y = 0; y < 192; y++) for (let x = 0; x < 256; x++) pixel(x, y, bg);
  const text = (value, x, y, size, color) => {
    for (const character of value) {
      const glyph = glyphs[character];
      if (glyph) glyph.split('/').forEach((row, dy) => [...row].forEach((bit, dx) => {
        if (bit === '1') for (let sy = 0; sy < size; sy++) for (let sx = 0; sx < size; sx++) pixel(x + dx * size + sx, y + dy * size + sy, color);
      }));
      x += 6 * size;
    }
  };
  for (let x = 7; x < 249; x++) { pixel(x, 7, 0xbeb0); pixel(x, 184, 0xbeb0); }
  text(bottom ? 'TOUCH LAB' : 'TWIN LAB', 26, 22, 3, 0xd7bf);
  text(bottom ? 'DRAG TO DRAW IN YELLOW' : 'ORIGINAL DS HOMEBREW', 14, 53, 1, 0xef7b);
  text(bottom ? 'LOWER LCD / STYLUS' : 'ARROWS MOVE / Z A / C X', 14, 163, 1, 0xef7b);
  return bytes;
}

export function createDsDemoRom() {
  const rom = new Uint8Array(256 * 1024), view = new DataView(rom.buffer);
  const arm9 = arm9Program(), arm7 = arm7Program();
  if (arm9.length > 4096) throw new Error('DS demo ARM9 code overlaps its artwork.');
  rom.set(new TextEncoder().encode('TWIN LAB    BBDS00'), 0);
  rom[0x14] = 1;
  for (const [offset, value] of [
    [0x20, 0x200], [0x24, 0x02000000], [0x28, 0x02000000], [0x2c, 0x31000],
    [0x30, 0x32000], [0x34, 0x03800000], [0x38, 0x03800000], [0x3c, arm7.length],
    [0x80, rom.length], [0x84, 0x200],
  ]) view.setUint32(offset, value, true);
  rom.set(arm9, 0x200); rom.set(framebuffer(false), 0x1200); rom.set(framebuffer(true), 0x19200);
  rom.set(arm7, 0x32000);
  let crc = 0xffff;
  for (const byte of rom.subarray(0, 0x15e)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? crc >>> 1 ^ 0xa001 : crc >>> 1;
  }
  view.setUint16(0x15e, crc, true);
  return rom;
}
