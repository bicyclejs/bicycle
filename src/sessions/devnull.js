import Promise from 'promise';

export default DevNullSession;
function DevNullSession() {
  this._cache = {};
  this._queries = {};
}
DevNullSession.prototype.getCache = function (sessionId: string): Promise<Object> {
  return Promise.resolve({});
};
DevNullSession.prototype.setCache = function (sessionId: string, data: Object): Promise {
  return Promise.resolve(null);
};
DevNullSession.prototype.getQuery = function (sessionId: string): Promise<?Object> {
  return Promise.resolve(null);
};
DevNullSession.prototype.setQuery = function (sessionId: string, query: Object): Promise {
  return Promise.resolve(null);
};
