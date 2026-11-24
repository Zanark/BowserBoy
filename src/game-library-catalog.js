export const GAME_SLOTS = Object.freeze(['gba', 'ds'].flatMap(system =>
  [1, 2, 3].map(number => Object.freeze({
    id: `${system}-${number}`, system, number,
    title: `${system === 'gba' ? 'GBA' : 'DS'} GAME ${number}`,
    color: (system === 'gba' ? ['#d78358', '#76a58a', '#9e86b7'] : ['#5895c2', '#c9a45c', '#bd7f95'])[number - 1],
    romPath: `library/${system}/slot-${number}/game.${system === 'gba' ? 'gba' : 'nds'}`,
    coverPath: `library/${system}/slot-${number}/cover.png`,
  }))));

export function gameSlot(id) {
  const slot = GAME_SLOTS.find(slot => slot.id === id);
  if (!slot) throw new Error('Unknown game shelf slot.');
  return slot;
}

export function validateLibraryEntry(id, entry) {
  const { system } = gameSlot(id);
  const extension = system === 'gba' ? /\.gba$/i : /\.nds$/i;
  const maximum = system === 'gba' ? 32 * 1024 * 1024 : 512 * 1024 * 1024;
  if (!entry || typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 100 ||
      typeof entry.gameId !== 'string' || !/^[a-f0-9]{64}$/.test(entry.gameId) ||
      typeof entry.name !== 'string' || !extension.test(entry.name) ||
      !(entry.file instanceof Blob) || entry.file.size < (system === 'gba' ? 192 : 512) || entry.file.size > maximum ||
      !(entry.cover === null || entry.cover instanceof Blob && entry.cover.type === 'image/png' &&
        entry.cover.size <= 12 * 1024 * 1024)) {
    throw new Error('Stored game shelf slot is invalid. Console checkpoints are unchanged.');
  }
  return entry;
}

export function validateLibrarySelection(value) {
  if (!value || value.version !== 1 ||
      !['gba', 'ds'].every(system => value[system] === null ||
        GAME_SLOTS.some(slot => slot.system === system && slot.id === value[system]))) {
    throw new Error('Stored last-played shelf selection is invalid.');
  }
  return value;
}
