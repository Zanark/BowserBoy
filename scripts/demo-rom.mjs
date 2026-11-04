// Original ARM7TDMI input-test cartridge. No Nintendo logo, BIOS or third-party ROM bytes.
export function createDemoRom({ tone = false } = {}) {
  const words = [];
  const labels = new Map();
  const branches = [];
  const literals = [];
  const emit = (word) => words.push(word >>> 0);
  const label = (name) => labels.set(name, words.length);
  const imm = (value) => {
    for (let rotate = 0; rotate < 16; rotate++) {
      const bits = rotate * 2;
      const shifted = ((value << bits) | (value >>> (32 - bits))) >>> 0;
      if (shifted <= 255) return (rotate << 8) | shifted;
    }
    throw new Error(`Unencodable ARM immediate: ${value}`);
  };
  const mov = (reg, value, condition = 14) => emit((condition << 28) | 0x03a00000 | (reg << 12) | imm(value));
  const add = (reg, value, condition = 14) => emit((condition << 28) | 0x02800000 | (reg << 16) | (reg << 12) | imm(value));
  const sub = (reg, value, condition = 14) => emit((condition << 28) | 0x02400000 | (reg << 16) | (reg << 12) | imm(value));
  const compare = (reg, value) => emit(0xe3500000 | (reg << 16) | imm(value));
  const test = (reg, value) => emit(0xe3100000 | (reg << 16) | imm(value));
  const literal = (reg, value, condition = 14) => {
    literals.push({ index: words.length, reg, value, condition });
    emit(0);
  };
  const branch = (target, condition = 14) => {
    branches.push({ index: words.length, target, condition });
    emit(0);
  };
  const square = (name) => {
    emit(0xe1a07485); // r7 = y * 512
    emit(0xe0477285); // r7 -= y * 32
    emit(0xe0877084); // r7 += x * 2
    emit(0xe087700a); // r7 += framebuffer
    mov(8, 8);
    label(`${name}-row`);
    mov(9, 8);
    label(`${name}-pixel`);
    emit(0xe0c730b2);
    emit(0xe2599001);
    branch(`${name}-pixel`, 1);
    add(7, 464);
    emit(0xe2588001);
    branch(`${name}-row`, 1);
  };
  literal(0, 0x04000000);
  literal(1, 0x0403);
  emit(0xe1c010b0); // strh r1, [r0]: mode 3, BG2 enabled
  if (tone) {
    // Original 440 Hz, half-volume PSG square for real-core audio regression.
    for (const [offset, value] of [[0x84, 0x80], [0x80, 0x1177], [0x82, 2], [0x62, 0x8080], [0x64, 0x86d6]]) {
      literal(1, value);
      emit(0xe1c010b0 | ((offset & 0xf0) << 4) | (offset & 15));
    }
  }
  literal(10, 0x06000000);
  literal(11, 0x04000130);
  literal(12, 0x0e000000);
  emit(0xe5dc4000); // ldrb r4, [r12]: saved horizontal position
  compare(4, 232); mov(4, 108, 8);
  mov(5, 76);
  emit(0xe1a0100a);
  literal(2, 38400);
  literal(3, 0x18a5);
  label('clear');
  emit(0xe0c130b2);
  emit(0xe2522001);
  branch('clear', 1);
  label('frame');
  label('visible');
  emit(0xe1d010b6);
  compare(1, 160);
  branch('visible', 10);
  label('vblank');
  emit(0xe1d010b6);
  compare(1, 160);
  branch('vblank', 11);
  literal(3, 0x18a5);
  square('erase');
  emit(0xe1db60b0); // ldrh r6, [r11]: active-low key input
  test(6, 32); sub(4, 2, 0);
  test(6, 16); add(4, 2, 0);
  test(6, 64); sub(5, 2, 0);
  test(6, 128); add(5, 2, 0);
  compare(4, 0); mov(4, 0, 11);
  compare(4, 232); mov(4, 232, 12);
  compare(5, 0); mov(5, 0, 11);
  compare(5, 152); mov(5, 152, 12);
  test(6, 2);
  emit(0x05cc4000); // streqb r4, [r12]: B saves horizontal position to SRAM
  test(6, 1);
  literal(3, 0x43f2, 1);
  literal(3, 0x02ff, 0);
  square('draw');
  branch('frame');
  for (const entry of branches) {
    words[entry.index] = ((entry.condition << 28) | 0x0a000000 |
      ((labels.get(entry.target) - entry.index - 2) & 0x00ffffff)) >>> 0;
  }
  for (const entry of literals) {
    const offset = (words.length - entry.index - 2) * 4;
    words[entry.index] = ((entry.condition << 28) | 0x059f0000 | (entry.reg << 12) | offset) >>> 0;
    emit(entry.value);
  }
  const rom = new Uint8Array(1024);
  const view = new DataView(rom.buffer);
  view.setUint32(0, 0xea00002e, true);
  rom.set(new TextEncoder().encode('PIXEL LAB   '), 0xa0);
  rom.set(new TextEncoder().encode('BB01'), 0xac);
  rom[0xb2] = 0x96;
  rom[0xb3] = 0;
  let checksum = 0;
  for (let i = 0xa0; i <= 0xbc; i++) checksum -= rom[i];
  rom[0xbd] = (checksum - 0x19) & 255;
  words.forEach((word, index) => view.setUint32(0xc0 + index * 4, word, true));
  rom.set(new TextEncoder().encode('SRAM_V113'), 0x380);
  return rom;
}
