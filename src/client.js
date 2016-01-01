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
  serverPreparation: {sessionID?: string, query?: Object, cache?: Object} = {},
  options = {}
) {
  this._options = options;
  this._sessionID = serverPreparation.sessionID || (Date.now()).toString(35) + Math.random().toString(35).substr(2, 7);
  this._networkLayer = networkLayer || new DefaultNetworkLayer();

  this._queries = [];
  this._queriesCount = [];
  this._queriesLoaded = [];

  this._query = serverPreparation.query || {};

  this._cache = serverPreparation.cache || {root: {}};
  this._optimisticCache = {root: {}};
  this._updateHandlers = [];

  this._optimisticUpdaters = {};

  this._newSession = !serverPreparation.sessionID;
  this._serverQuery = serverPreparation.query || {};
  this._pendingMutations = [];

  this._currentRequest = null;
  this._requestInFlight = false;
  this._requestQueued = false;

  this._syncUpdate();
}
Client.prototype._queueRequest = function () {
  if (this._requestInFlight) {
    this._requestQueued = true;
  }
  if (!this._currentRequest) {
    this._fireRequest(30);
  }
  return this._currentRequest;
};
Client.prototype._fireRequest = function (timeout, errCount = 0) {
  this._requestQueued = false;
  return this._currentRequest = new Promise((resolve, reject) => {
    setTimeout(() => {
      this._requestInFlight = true;
      this._doRequest().done(
        () => {
          this._requestInFlight = false;
          this._currentRequest = null;
          if (this._requestQueued) {
            this._fireRequest(0);
          }
          resolve();
        },
        err => {
          this._requestInFlight = false;
          this._currentRequest = null;
          this._fireRequest(timeout + (1000 * (errCount + Math.random())), errCount + 1);
          reject(err);
        },
      );
    }, timeout);
  });
};
Client.prototype._doRequest = function () {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const pendingMutations = this._pendingMutations.slice();
      const requests = pendingMutations.map(update => ({action: MUTATE, args: update.mutation}));
      if (this._newSession) {
        requests.push({action: INIT_SESSION});
      }
      const localQuery = this._query;
      const diff = diffQueries(this._serverQuery, localQuery);
      if (diff !== undefined) {
        requests.push({action: UPDATE_QUERY, args: diff});
      } else if (this._newSession) {
        requests.push({action: UPDATE_QUERY, args: localQuery});
      }
      if (requests.length === 0) return resolve(null);
      this._networkLayer.batch(this._sessionID, requests).done(
        response => {
          // clear pending mutations
          this._pendingMutations.splice(0, pendingMutations.length);
          if (response.expiredSession) {
            console.warn('session expired, starting new session');
            this._newSession = true;
            this._serverQuery = {};
            attempt();
            return;
          }
          this._newSession = false;
          this._serverQuery = localQuery;
          if (response.newSession) {
            this._cache = mergeCache({root: {}}, response.data);
          } else {
            this._cache = mergeCache(this._cache, response.data);
          }
          this._syncUpdate();
          resolve();
        },
        err => {
          // clear pending mutations
          this._pendingMutations.splice(0, pendingMutations.length);
          // reset to a new session (hopefully clearing the error in the process)
          this._newSession = true;
          this._serverQuery = {};
          this._syncUpdate();
          reject(err);
        }
      );
    };
    attempt();
  });
};

Client.prototype._syncUpdate = function () {
  clearTimeout(this._updateTimeout);
  this._optimisticCache = this._pendingMutations.reduce((cache, update) => {
    return mergeCache(cache, update.optimisticUpdate(cache));
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
Client.prototype._getQuery = function (): Object {
  return this._queries.reduce(mergeQueries, {});
};
Client.prototype._updateQuery = function (): Promise {
  this._query = this._getQuery();
  return this._queueRequest();
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
  if (!optimisticUpdate) {
    const split = method.split('.');
    optimisticUpdate = this._optimisticUpdaters[split[0]] && this._optimisticUpdaters[split[0]][split[1]];
  }
  this._pendingMutations.push({
    mutation,
    optimisticUpdate(cache) {
      return optimisticUpdate ? optimisticUpdate(args, cache) : cache;
    },
  });
  this._syncUpdate();
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
      if (this._options.cacheTimeout) {
        setTimeout(() => this.removeQuery(query), this._options.cacheTimeout);
      } else {
        this.removeQuery(query);
      }
    },
  };
};
