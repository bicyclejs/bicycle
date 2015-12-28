import Promise from 'promise';

const HALF_AN_HOUR = (30 * 60 * 1000);
export default MemorySession;
function MemorySession(expiresAfter: number = HALF_AN_HOUR) {
  this._expiresAfter = expiresAfter;
  this._cache = {};
  this._queries = {};
  this._timeout = {};
}
MemorySession.prototype._onAccess = function (sessionId: string) {
  console.log('Access: ' + sessionId);
  clearTimeout(this._timeout[sessionId]);
  this._timeout[sessionId] = setTimeout(() => {
    console.log('Clear: ' + sessionId);
    if (sessionId in this._cache) delete this._cache[sessionId];
    if (sessionId in this._queries) delete this._queries[sessionId];
    if (sessionId in this._timeout) delete this._timeout[sessionId];
  }, this._expiresAfter);
};
MemorySession.prototype.getCache = function (sessionId: string): Promise<Object> {
  this._onAccess(sessionId);
  return Promise.resolve(this._cache[sessionId] || {});
};
MemorySession.prototype.setCache = function (sessionId: string, data: Object): Promise {
  this._onAccess(sessionId);
  this._cache[sessionId] = data;
  return Promise.resolve(null);
};
MemorySession.prototype.getQuery = function (sessionId: string): Promise<?Object> {
  this._onAccess(sessionId);
  return Promise.resolve(this._queries[sessionId] || null);
};
MemorySession.prototype.setQuery = function (sessionId: string, query: Object) {
  this._onAccess(sessionId);
  this._queries[sessionId] = query;
  return Promise.resolve(null);
};
