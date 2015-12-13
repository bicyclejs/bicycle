import Promise from 'promise';

class MemoryStore {
  constructor() {
    this._store = {};
  }
  set(session, key, value) {
    if (!this._store[session]) this._store[session] = {};
    this._store[session]['!' + key] = value;
    return Promise.resolve(null);
  }
  get(session, key) {
    if (!this._store[session]) this._store[session] = {};
    return Promise.resolve(this._store[session]['!' + key]);
  }
}
export default MemoryStore;
