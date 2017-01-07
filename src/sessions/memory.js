// @public
// @flow

import type {Query, SessionID, SessionStore} from '../flow-types';
import Promise from 'promise';
import freeze from '../utils/freeze';

const NULL_PROMISE = Promise.resolve(null);
const EMPTY_OBJECT_PROMISE = Promise.resolve(freeze({}));

const HALF_AN_HOUR = (30 * 60 * 1000);

class MemorySession {
  _expiresAfter: number;
  _cache: Object;
  _queries: Object;
  _timeout: Object;

  constructor(expiresAfter: number = HALF_AN_HOUR) {
    this._expiresAfter = expiresAfter;
    this._cache = {};
    this._queries = {};
    this._timeout = {};
  }
  _onAccess(sessionId: string) {
    clearTimeout(this._timeout[sessionId]);
    this._timeout[sessionId] = setTimeout(() => {
      if (sessionId in this._cache) delete this._cache[sessionId];
      if (sessionId in this._queries) delete this._queries[sessionId];
      if (sessionId in this._timeout) delete this._timeout[sessionId];
    }, this._expiresAfter);
  }
  getCache(sessionId: SessionID): Promise<Object> {
    this._onAccess(sessionId);
    return this._cache[sessionId] || EMPTY_OBJECT_PROMISE;
  }
  setCache(sessionId: SessionID, data: Object): Promise<null> {
    this._onAccess(sessionId);
    this._cache[sessionId] = Promise.resolve(freeze(data));
    return NULL_PROMISE;
  }
  getQuery(sessionId: SessionID): Promise<?Query> {
    this._onAccess(sessionId);
    return this._queries[sessionId] || NULL_PROMISE;
  }
  setQuery(sessionId: SessionID, query: Query): Promise<null> {
    this._onAccess(sessionId);
    this._queries[sessionId] = Promise.resolve(freeze(query));
    return NULL_PROMISE;
  }
}

export default MemorySession;
