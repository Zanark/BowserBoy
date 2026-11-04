import { MANUAL_SLOTS, MAX_ROM_BYTES, RUNTIME, validateBatterySave, validateCapture } from './cartridge.js';

function validateDevice(device) {
  const cartridge = device?.cartridge;
  if (device?.version !== 1 || typeof device.powered !== 'boolean' ||
      !(cartridge === null || (typeof cartridge?.name === 'string' && /\.gba$/i.test(cartridge.name) &&
        cartridge.bytes instanceof Blob && cartridge.bytes.size >= 192 && cartridge.bytes.size <= MAX_ROM_BYTES))) {
    throw new Error('Stored console state is invalid. Your game checkpoints are unchanged.');
  }
  return device;
}

export class SaveStore {
  #db;

  async open() {
    if (!globalThis.indexedDB) throw new Error('This browser does not provide IndexedDB storage.');
    this.#db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('bowser-boy-advance', 2);
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        reject(new Error('Browser storage did not open. Close other copies of this page and try again.'));
      }, 5000);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('games')) db.createObjectStore('games', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('device')) db.createObjectStore('device');
      };
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

  async getDevice() {
    const device = await this.#transaction('readonly', (store) => store.get('console'), false, 'device');
    return device === undefined ? { version: 1, powered: false, cartridge: null } : validateDevice(device);
  }

  async putDevice(powered, file) {
    const device = validateDevice({
      version: 1, powered, cartridge: file ? { name: file.name, bytes: file } : null,
    });
    await this.#transaction('readwrite', (store) => store.put(device, 'console'), false, 'device');
  }

  async putSlot(game, slot, capture) {
    validateCapture(capture);
    if (!['automatic', ...MANUAL_SLOTS].includes(slot)) throw new Error('Unknown save slot.');
    return this.#update(game, (record) => {
      const createdAt = new Date().toISOString();
      record[slot] = { ...capture, createdAt };
      record.battery = { sram: capture.sram, createdAt };
      record.bootMode = 'checkpoint';
    });
  }

  async putBattery(game, sram) {
    validateBatterySave(sram);
    return this.#update(game, (record) => {
      record.battery = { sram, createdAt: new Date().toISOString() };
      record.bootMode = 'battery';
    });
  }

  #update(game, update) {
    return this.#transaction('readwrite', (store) => {
      const request = store.get(game.id);
      request.onsuccess = () => {
        try {
          const record = request.result ?? { ...game, runtime: RUNTIME };
          if (record.runtime !== RUNTIME) throw new Error('Stored checkpoint runtime is incompatible.');
          update(record);
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

  #transaction(mode, action, saved = false, storeName = 'games') {
    if (!this.#db) return Promise.reject(new Error('Browser save storage is unavailable.'));
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(storeName, mode);
      let request;
      try { request = action(transaction.objectStore(storeName)); }
      catch (error) {
        transaction.abort();
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(saved ? request.savedRecord : request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error('The browser could not save progress.'));
      transaction.onabort = () => reject(request.saveError ?? transaction.error ?? new Error('The save transaction was interrupted.'));
    });
  }
}
