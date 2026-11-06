import { DS_RUNTIME, validateDsCapture } from './ds-cartridge.js';

export class DsSaveStore {
  async open() {
    if (!globalThis.indexedDB) throw new Error('DS saves need IndexedDB. Export a backup before leaving this session.');
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('bowserboy-ds', 1);
      let expired = false;
      const timer = setTimeout(() => { expired = true; reject(new Error('DS storage did not open. Close other copies and reload.')); }, 5000);
      request.onupgradeneeded = () => request.result.createObjectStore('checkpoints');
      request.onerror = () => { clearTimeout(timer); reject(request.error); };
      request.onblocked = () => { clearTimeout(timer); expired = true; reject(new Error('DS save storage is blocked. Close other copies and reload.')); };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (expired) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  async get(id) {
    const saved = await this.transaction('readonly', store => store.get(`${DS_RUNTIME}:${id}`));
    if (saved !== undefined) {
      if (saved.runtime !== DS_RUNTIME || saved.rom !== id) throw new Error('Stored DS checkpoint identity is incompatible.');
      validateDsCapture(saved);
    }
    return saved ?? null;
  }

  async put(id, capture) {
    validateDsCapture(capture);
    return this.transaction('readwrite', store => store.put({
      ...capture, runtime: DS_RUNTIME, rom: id, createdAt: new Date().toISOString(),
    }, `${DS_RUNTIME}:${id}`));
  }

  transaction(mode, action) {
    if (!this.db) return Promise.reject(new Error('DS storage is unavailable. Use Export checkpoint.'));
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('checkpoints', mode);
      let request;
      try { request = action(tx.objectStore('checkpoints')); }
      catch (error) { tx.abort(); reject(error); return; }
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('DS checkpoint transaction failed. Export a backup before leaving.'));
    });
  }
}
