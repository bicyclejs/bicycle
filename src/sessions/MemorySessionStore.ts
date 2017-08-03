import Cache from '../types/Cache';
import Query from '../types/Query';
import SessionID from '../types/SessionID';
import SessionStore from './SessionStore';

const NULL_PROMISE = Promise.resolve(null);
const EMPTY_PROMISE = Promise.resolve(undefined);

const HALF_AN_HOUR = 30 * 60 * 1000;

class MemorySessionStore implements SessionStore {
  private _expiresAfter: number;
  private _cache: Map<SessionID, Promise<Cache>> = new Map();
  private _queries: Map<SessionID, Promise<Query>> = new Map();
  private _timeout: Map<SessionID, NodeJS.Timer> = new Map();

  constructor(expiresAfter: number = HALF_AN_HOUR) {
    this._expiresAfter = expiresAfter;
  }
  private _onAccess(sessionId: SessionID) {
    const oldTimeout = this._timeout.get(sessionId);
    if (oldTimeout) clearTimeout(oldTimeout);
    this._timeout.set(
      sessionId,
      setTimeout(() => {
        if (sessionId in this._cache) this._cache.delete(sessionId);
        if (sessionId in this._queries) this._queries.delete(sessionId);
        if (sessionId in this._timeout) this._timeout.delete(sessionId);
      }, this._expiresAfter),
    );
  }
  getCache(sessionId: SessionID): Promise<Cache | null> {
    this._onAccess(sessionId);
    return this._cache.get(sessionId) || NULL_PROMISE;
  }
  setCache(sessionId: SessionID, data: Cache): Promise<void> {
    this._onAccess(sessionId);
    this._cache.set(sessionId, Promise.resolve(data));
    return EMPTY_PROMISE;
  }
  getQuery(sessionId: SessionID): Promise<Query | null> {
    this._onAccess(sessionId);
    return this._queries.get(sessionId) || NULL_PROMISE;
  }
  setQuery(sessionId: SessionID, query: Query): Promise<void> {
    this._onAccess(sessionId);
    this._queries.set(sessionId, Promise.resolve(query));
    return EMPTY_PROMISE;
  }
}

export default MemorySessionStore;
