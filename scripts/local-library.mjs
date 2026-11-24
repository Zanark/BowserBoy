import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GAME_SLOTS } from '../src/game-library-catalog.js';

const routes = new Map(GAME_SLOTS.flatMap(slot => [
  [slot.romPath, { slot, name: `game.${slot.system === 'gba' ? 'gba' : 'nds'}`, type: 'application/octet-stream', maximum: slot.system === 'gba' ? 32 * 1024 * 1024 : 512 * 1024 * 1024 }],
  [slot.coverPath, { slot, name: 'cover.png', type: 'image/png', maximum: 12 * 1024 * 1024 }],
]));

async function fileInfo(root, slot, name, maximum) {
  const paths = [root, join(root, slot.system), join(root, slot.system, `slot-${slot.number}`)];
  let file;
  try {
    for (const path of paths) {
      const stat = await lstat(path);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Local library directories must be real directories, not links.');
    }
    file = join(paths[2], name);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Local library inputs must be regular files, not links.');
    if (stat.size > maximum) throw new Error(`Oversized local library ${name} in ${slot.id}.`);
    return file;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function localLibraryResponse(relative, root) {
  if (relative === 'library/manifest.json') {
    const slots = [];
    for (const slot of GAME_SLOTS) {
      const rom = await fileInfo(root, slot, routes.get(slot.romPath).name, routes.get(slot.romPath).maximum);
      const cover = await fileInfo(root, slot, 'cover.png', 12 * 1024 * 1024);
      const titleFile = await fileInfo(root, slot, 'title.txt', 400);
      const title = titleFile ? (await readFile(titleFile, 'utf8')).trim() : null;
      if (title !== null && (!title || title.length > 100)) throw new Error(`Use 1-100 characters in ${slot.id}/title.txt.`);
      if (rom || cover || title) slots.push({ id: slot.id, rom: !!rom, cover: !!cover, title });
    }
    return { status: 200, type: 'application/json', data: Buffer.from(JSON.stringify({ version: 1, slots })) };
  }
  const route = routes.get(relative);
  if (!route) return null;
  const file = await fileInfo(root, route.slot, route.name, route.maximum);
  return file ? { status: 200, type: route.type, data: await readFile(file) } :
    { status: 404, type: 'text/plain', data: Buffer.from('No local file attached to this game box') };
}
