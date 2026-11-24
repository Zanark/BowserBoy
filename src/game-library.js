import { GAME_SLOTS, gameSlot } from './game-library-catalog.js';
import { identifyRom } from './cartridge.js';
import { identifyDsRom } from './ds-cartridge.js';

const $ = id => document.getElementById(id);

export class GameLibrary {
  constructor(view, store, hooks) {
    this.view = view;
    this.store = store;
    this.hooks = hooks;
    this.entries = new Map();
    this.artwork = new Map();
    this.selection = { version: 1, gba: null, ds: null };
    this.busy = false;
    this.rows = new Map();
    view.onGameSlot = id => void this.play(id);
    $('game-library-open').addEventListener('click', () => {
      if (this.busy || hooks.isBusy()) { hooks.notice('Wait for the console or box to finish moving.', true); return; }
      this.render();
      $('game-library').showModal();
    });
    $('game-library-close').addEventListener('click', () => $('game-library').close());
    for (const slot of GAME_SLOTS) {
      const row = document.createElement('article');
      row.className = 'game-library-slot';
      row.dataset.slot = slot.id;
      row.innerHTML = `<h3></h3><p class="game-library-state"></p>
        <label>Game title<input class="game-library-title" maxlength="100"></label>
        <div class="game-library-actions">
          <button class="game-library-play" type="button"></button>
          <label class="game-library-file">Choose ROM<input class="game-library-rom" type="file" accept="${slot.system === 'gba' ? '.gba' : '.nds'}"></label>
          <label class="game-library-file">Cover PNG<input class="game-library-cover" type="file" accept="image/png,.png"></label>
        </div>`;
      row.querySelector('h3').textContent = `${slot.system === 'gba' ? 'GBA' : 'DS'} / BOX ${slot.number}`;
      row.querySelector('.game-library-title').setAttribute('aria-label', `${slot.id} game title`);
      row.querySelector('.game-library-rom').setAttribute('aria-label', `${slot.id} ROM`);
      row.querySelector('.game-library-cover').setAttribute('aria-label', `${slot.id} cover PNG`);
      row.querySelector('.game-library-play').addEventListener('click', () => void this.play(slot.id));
      row.querySelector('.game-library-rom').addEventListener('change', event => {
        const file = event.target.files[0]; event.target.value = '';
        if (file) void this.run(() => this.importRom(slot.id, file));
      });
      row.querySelector('.game-library-cover').addEventListener('change', event => {
        const file = event.target.files[0]; event.target.value = '';
        if (file) void this.run(() => this.importCover(slot.id, file));
      });
      row.querySelector('.game-library-title').addEventListener('change', event => {
        const value = event.target.value;
        void this.run(() => this.rename(slot.id, value));
      });
      this.rows.set(slot.id, row);
      $(`game-library-${slot.system}`).append(row);
    }
  }

  async initialize() {
    if (this.hooks.storageAvailable()) {
      this.selection = await this.store.getLibrarySelection();
      for (const slot of GAME_SLOTS) {
        const entry = await this.store.getLibrarySlot(slot.id);
        if (!entry) continue;
        this.entries.set(slot.id, entry);
        if (entry.cover) await this.setCover(slot.id, entry.cover, entry.title);
        else this.view.gameShelves.setArtwork(slot.id, entry.title);
      }
    }
    const local = await fetch(new URL('./library/manifest.json', document.baseURI),
      { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (local.ok) {
      const manifest = await local.json();
      if (manifest.version !== 1 || !Array.isArray(manifest.slots)) throw new Error('Local game library manifest is invalid.');
      for (const value of manifest.slots) {
        const slot = gameSlot(value.id);
        if (value.rom) {
          const response = await fetch(new URL(`./${slot.romPath}`, document.baseURI), { cache: 'no-store' });
          if (!response.ok) throw new Error(`Could not read the local ROM for ${slot.id}.`);
          const file = new File([await response.blob()], `game.${slot.system === 'gba' ? 'gba' : 'nds'}`);
          await this.importRom(slot.id, file, { restore: true });
        }
        if (value.cover) {
          const response = await fetch(new URL(`./${slot.coverPath}`, document.baseURI), { cache: 'no-store' });
          if (!response.ok) throw new Error(`Could not read the local cover for ${slot.id}.`);
          await this.importCover(slot.id, new Blob([await response.arrayBuffer()], { type: 'image/png' }));
        }
        if (value.title !== null && value.title !== undefined) {
          if (typeof value.title !== 'string' || value.title.length > 100) throw new Error('Local box title must be at most 100 characters.');
          await this.rename(slot.id, value.title);
        }
      }
    } else if (local.status !== 404) throw new Error(`Local game library discovery failed (${local.status}).`);
    for (const system of ['gba', 'ds']) {
      const id = this.selection[system], entry = this.entries.get(id);
      if (!entry) continue;
      if (await this.hooks.load(gameSlot(id), entry, { preload: true })) {
        this.view.gameShelves.setLastPlayed(id, entry.title);
      }
    }
    this.render();
    $('game-library-open').disabled = false;
  }

  render() {
    for (const slot of GAME_SLOTS) {
      const row = this.rows.get(slot.id), entry = this.entries.get(slot.id);
      const current = this.selection[slot.system] === slot.id && this.hooks.current(slot.system) === entry?.gameId;
      row.querySelector('.game-library-title').value = entry?.title ?? this.artwork.get(slot.id)?.title ?? slot.title;
      row.querySelector('.game-library-state').textContent = entry ?
        `${current ? 'LAST PLAYED / ' : ''}${entry.name} / ${this.hooks.storageAvailable() ? 'BROWSER-LOCAL' : 'THIS PAGE ONLY'}` :
        'DUMMY BOX / NO ROM ATTACHED';
      row.querySelector('.game-library-play').textContent = current ? 'Resume game' : entry ? 'Load game' : 'Preview box';
      for (const control of row.querySelectorAll('button,input')) control.disabled = this.busy;
    }
  }

  async run(action) {
    if (this.busy || this.hooks.isBusy()) {
      this.hooks.notice('Wait for the console or box to finish moving.', true);
      return;
    }
    this.busy = true;
    this.render();
    try { await action(); }
    catch (error) {
      console.error('Game shelf:', error);
      this.view.gameShelves.cancel();
      this.hooks.notice(error.message, true);
      $('game-library-status').textContent = error.message;
    } finally { this.busy = false; this.render(); }
  }

  async persist(id, entry) {
    if (this.hooks.storageAvailable()) await this.store.putLibrarySlot(id, entry);
    else this.hooks.notice('Browser storage is unavailable. This box will only remember its ROM until the page closes.', true);
    this.entries.set(id, entry);
  }

  async importRom(id, file, { restore = false } = {}) {
    const slot = gameSlot(id);
    const identified = await (slot.system === 'gba' ? identifyRom(file) : identifyDsRom(file));
    const previous = this.entries.get(id), art = this.artwork.get(id);
    if (restore && previous?.gameId === identified.id) return;
    const title = previous?.title ?? art?.title ?? (restore ? slot.title : identified.title);
    const entry = { title, gameId: identified.id, name: file.name, file, cover: previous?.cover ?? art?.cover ?? null };
    await this.persist(id, entry);
    if (entry.cover) await this.setCover(id, entry.cover, title);
    else this.view.gameShelves.setArtwork(id, title);
    $('game-library-status').textContent = `${title} attached to ${id}. Choose Load game when ready.`;
    this.render();
  }

  async setCover(id, blob, title) {
    if (blob.type !== 'image/png' || blob.size > 12 * 1024 * 1024 || !blob.size) throw new Error('Choose a PNG cover smaller than 12 MB.');
    const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    if (![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) throw new Error('The cover is not a valid PNG image.');
    const image = await createImageBitmap(blob);
    try {
      if (image.width > 8192 || image.height > 8192) throw new Error('Cover dimensions must not exceed 8192 pixels.');
      this.view.gameShelves.setArtwork(id, title, image);
    } finally { image.close(); }
  }

  async importCover(id, blob) {
    const entry = this.entries.get(id), title = entry?.title ?? this.artwork.get(id)?.title ?? gameSlot(id).title;
    await this.setCover(id, blob, title);
    if (entry) await this.persist(id, { ...entry, cover: blob });
    else this.artwork.set(id, { title, cover: blob });
    $('game-library-status').textContent = `${id} cover updated${entry ? '.' : ' for this page; attach a ROM to remember it.'}`;
  }

  async rename(id, value) {
    const title = value.trim();
    if (!title) throw new Error('Give the box a non-empty game title.');
    const entry = this.entries.get(id), art = this.artwork.get(id);
    if (entry) await this.persist(id, { ...entry, title });
    else this.artwork.set(id, { title, cover: art?.cover ?? null });
    const cover = entry?.cover ?? art?.cover;
    if (cover) await this.setCover(id, cover, title);
    else this.view.gameShelves.setArtwork(id, title);
    $('game-library-status').textContent = `${id} title updated${entry ? '.' : ' for this page; attach a ROM to remember it.'}`;
  }

  async play(id) {
    return this.run(async () => {
      const slot = gameSlot(id), entry = this.entries.get(id);
      if ($('game-library').open) $('game-library').close();
      if (!entry) {
        this.view.gameShelves.preview(id, { dummy: true });
        this.hooks.notice(`${slot.title} is an empty model. Preview only; attach a local ROM using Games.`, true);
        return;
      }
      const current = this.selection[slot.system] === id && this.hooks.current(slot.system) === entry.gameId;
      await this.hooks.operation(async () => {
        try {
          await this.hooks.selectConsole(slot.system);
          if (!current && !await this.view.gameShelves.preview(id)) return;
          if (!await this.hooks.load(slot, entry)) { this.view.gameShelves.cancel(); return; }
          const selection = { ...this.selection, [slot.system]: id };
          if (this.hooks.storageAvailable()) await this.store.putLibrarySelection(selection);
          else this.hooks.notice('Game running for this page only; last-played box cannot be remembered without browser storage.', true);
          this.selection = selection;
          this.view.gameShelves.setLastPlayed(id, entry.title);
        } catch (error) {
          this.view.gameShelves.cancel();
          throw error;
        }
      });
    });
  }
}
