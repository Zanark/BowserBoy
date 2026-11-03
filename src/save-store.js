import { RUNTIME, validateCapture } from './cartridge.js';

export class SaveStore {
  #db;

  async open() {
    if (!globalThis.indexedDB) throw new Error('This browser does not provide IndexedDB storage.');
    this.#db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('bowser-boy-advance', 1);
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        reject(new Error('Browser storage did not open. Close other copies of this page and try again.'));
      }, 5000);
      request.onupgradeneeded = () => request.result.createObjectStore('games', { keyPath: 'id' });
      request.onerror = () => { clearTimeout(timer); reject(request.error); };
      request.onblocked = () => {
        clearTimeout(timer);
        expired = true;
        reject(new Error('Browser storage is blocked by another open tab. Close it and reload.'));
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (expired) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  async get(id) {
    return this.#transaction('readonly', (store) => store.get(id));
  }

  async putSlot(game, slot, capture) {
    validateCapture(capture);
    if (!['automatic', 'manual'].includes(slot)) throw new Error('Unknown save slot.');
    return this.#transaction('readwrite', (store) => {
      const request = store.get(game.id);
      request.onsuccess = () => {
        try {
          const record = request.result ?? { ...game, runtime: RUNTIME };
          if (record.runtime !== RUNTIME) throw new Error('Stored checkpoint runtime is incompatible.');
          record[slot] = { ...capture, createdAt: new Date().toISOString() };
          store.put(record);
          request.savedRecord = record;
        } catch (error) {
          request.saveError = error;
          store.transaction.abort();
        }
      };
      return request;
    }, true);
  }

  #transaction(mode, action, saved = false) {
    if (!this.#db) return Promise.reject(new Error('Browser save storage is unavailable.'));
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction('games', mode);
      const request = action(transaction.objectStore('games'));
      transaction.oncomplete = () => resolve(saved ? request.savedRecord : request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error('The browser could not save progress.'));
      transaction.onabort = () => reject(request.saveError ?? transaction.error ?? new Error('The save transaction was interrupted.'));
    });
  }
}
