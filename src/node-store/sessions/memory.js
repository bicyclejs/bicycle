import assert from 'assert';
import Promise from 'promise';

export default MemorySession;
function MemorySession() {
  this._cache = {};
  this._queries = {};
}
MemorySession.prototype.getCache = function (sessionId) {
  return Promise.resolve(this._cache[sessionId] || {});
};
MemorySession.prototype.setCache = function (sessionId, data) {
  this._cache[sessionId] = data;
  return Promise.resolve(null);
};
MemorySession.prototype.getQuery = function (sessionId) {
  return Promise.resolve(this._queries[sessionId] || {});
};
MemorySession.prototype.setQuery = function (sessionId, query) {
  this._queries[sessionId] = query;
  return Promise.resolve(null);
};
