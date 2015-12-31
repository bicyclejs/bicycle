import Promise from 'promise';
import DefaultNetworkLayer from './default-network-layer';
import {
  mergeQueries,
  diffQueries,
  runQueryAgainstCache,
  areDifferent,
  mergeCache,
  MUTATE,
  UPDATE_QUERY,
  INIT_SESSION,
} from './utils';

export default Client;
function Client(
  networkLayer: {batch: Function},
  serverPreparation: {sessionID?: string, query?: Object, cache?: Object} = {}
) {
  this._sessionID = serverPreparation.sessionID || (Date.now()).toString(35) + Math.random().toString(35).substr(2, 7);
  this._networkLayer = networkLayer || new DefaultNetworkLayer();
  this._query = serverPreparation.query || {};
  this._queries = [];
  this._queriesCount = [];
  this._queriesLoaded = [];
  this._cache = serverPreparation.cache || {root: {}};
  this._optimisticCache = {root: {}};
  this._optimisticUpdates = [];
  this._optimisticUpdaters = {};
  this._updateHandlers = [];

  this._currentRequest = null;
  this._requestInFlight = false;

  this._requests = serverPreparation.sessionID ? [] : [{action: INIT_SESSION}];
  this._syncUpdate();
}
Client.prototype._request = function (action: string, args: Object) {
  if (action === UPDATE_QUERY) {
    this._requests = this._requests.filter((req, i) => {
      return req.action !== UPDATE_QUERY;
    });
  }
  this._requests.push({action, args});
  if (this._currentRequest) {
    clearTimeout(this._requestTimeout);
  } else {
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    this._currentRequest = {promise, resolve, reject};
  }
  if (!this._requestInFlight) {
    this._requestTimeout = setTimeout(() => this._requestImmediately(), 0);
  }
  return this._currentRequest.promise;
};
Client.prototype._requestImmediately = function () {
  this._requestInFlight = true;
  const requests = this._requests;
  const currentRequest = this._currentRequest;
  this._requests = [];
  this._currentRequest = null;
  this._networkLayer.batch(this._sessionID, requests).done(
    response => {
      if (response.expiredSession) {
        console.warn('session expired, starting new session');
        this._requests.unshift({action: INIT_SESSION});
        this._requests.push({action: UPDATE_QUERY, args: this._getQuery()});
        this._currentRequest = currentRequest;
        this._requestImmediately();
        return;
      }
      if (response.newSession) {
        this._cache = mergeCache({root: {}}, response.data);
      } else {
        this._cache = mergeCache(this._cache, response.data);
      }
      currentRequest.resolve();
      this._asyncUpdate();
      this._requestInFlight = false;
      if (this._currentRequest) {
        this._requestTimeout = setTimeout(() => this._requestImmediately(), 0);
      }
    },
    err => {
      currentRequest.reject(err);
      this._requestInFlight = false;
      if (this._currentRequest) {
        this._requestTimeout = setTimeout(() => this._requestImmediately(), 0);
      }
    }
  );
};
Client.prototype._asyncUpdate = function () {
  clearTimeout(this._updateTimeout);
  this._updateTimeout = setTimeout(() => {
    this._syncUpdate();
  }, 0);
};
Client.prototype._syncUpdate = function () {
  clearTimeout(this._updateTimeout);
  this._optimisticCache = this._optimisticUpdates.reduce((cache, update) => {
    return mergeCache(cache, update(cache));
  }, this._cache);
  this._updateHandlers.forEach(handler => {
    handler();
  });
};
Client.prototype.onUpdate = function (fn: Function) {
  this._updateHandlers.push(fn);
};
Client.prototype.offUpdate = function (fn: Function) {
  this._updateHandlers.splice(this._updateHandlers.indexOf(fn), 1);
};
Client.prototype._getQuery = function () {
  return this._queries.reduce(mergeQueries, {});
};
Client.prototype._updateQuery = function () {
  const oldQuery = this._query;
  const newQuery = this._getQuery();
  const diff = diffQueries(oldQuery, newQuery);
  if (diff === undefined) return Promise.resolve(null);
  const updateQueryId = {};
  this._updateQueryId = updateQueryId;
  return this._request(UPDATE_QUERY, diff).then(() => {
    if (this._updateQueryId === updateQueryId) {
      this._query = newQuery;
      this._asyncUpdate();
    }
  });
};
Client.prototype.addQuery = function (query: Object): Promise {
  const i = this._queries.indexOf(query);
  if (i !== -1) {
    this._queriesCount[i]++;
    return this._queriesLoaded[i];
  }
  this._queries.push(query);
  this._queriesCount.push(1);
  const response = this._updateQuery();
  this._queriesLoaded.push(response);
  return response;
};
Client.prototype.removeQuery = function (query: Object): Promise {
  const i = this._queries.indexOf(query);
  if (i === -1) {
    console.warn('You attempted to remove a query that does not exist.');
    return Promise.resolve(null);
  }
  this._queriesCount[i]--;
  if (this._queriesCount[i] !== 0) return Promise.resolve(null);
  this._queries.splice(i, 1);
  this._queriesCount.splice(i, 1);
  this._queriesLoaded.splice(i, 1);
  return this._updateQuery();
};
Client.prototype.queryCache = function (query: Object) {
  return runQueryAgainstCache(this._optimisticCache, this._optimisticCache['root'], query);
};
Client.prototype.definieOptimisticUpdaters = function (updates: Object) {
  Object.keys(updates).forEach(t => {
    if (!this._optimisticUpdaters[t]) this._optimisticUpdaters[t] = {};
    Object.keys(updates[t]).forEach(k => {
      this._optimisticUpdaters[t][k] = updates[t][k];
    });
  });
};
Client.prototype.update = function (method: string, args: Object, optimisticUpdate?: Function): Promise {
  const mutation = {method, args};
  let op;
  if (!optimisticUpdate) {
    const split = method.split('.');
    optimisticUpdate = this._optimisticUpdaters[split[0]] && this._optimisticUpdaters[split[0]][split[1]];
  }
  if (optimisticUpdate) {
    op = cache => optimisticUpdate(args, cache);
    this._optimisticUpdates.push(op);
    this._syncUpdate();
  }
  return this._request(MUTATE, mutation).then(
    () => {
      if (optimisticUpdate) {
        this._optimisticUpdates.splice(this._optimisticUpdates.indexOf(op), 1);
        this._asyncUpdate();
      }
    },
    err => {
      if (optimisticUpdate) {
        this._optimisticUpdates.splice(this._optimisticUpdates.indexOf(op), 1);
        this._asyncUpdate();
      }
      throw err;
    },
  );
};
Client.prototype.subscribe = function (query: Object, fn: Function) {
  let lastValue = this.queryCache(query);
  fn(lastValue.result, !lastValue.notLoaded);
  const onUpdate = () => {
    const nextValue = this.queryCache(query);
    if (areDifferent(lastValue, nextValue)) {
      lastValue = nextValue;
      fn(nextValue.result, !nextValue.notLoaded);
    }
  };
  this.onUpdate(onUpdate);
  onUpdate();
  return {
    loaded: this.addQuery(query),
    unsubscribe: () => {
      this.offUpdate(onUpdate);
      this.removeQuery(query);
    },
  };
};
