// @public

import Promise from 'promise';
import mergeQueries from 'bicycle/utils/merge-queries';
import runQueryAgainstCache from 'bicycle/utils/run-query-against-cache';
import notEqual from 'bicycle/utils/not-equal';
import mergeCache from 'bicycle/utils/merge-cache';
import NetworkLayer from 'bicycle/network-layer';
import RequestBatcher from './request-batcher';
import Mutation from './mutation';

export {NetworkLayer};

function noop() {}
class Client {
  constructor(
    networkLayer: {send: Function} = new NetworkLayer(),
    serverPreparation: {sessionID?: string, query?: Object, cache?: Object} = {},
    options = {}
  ) {
    this._options = options;

    this._queries = [];
    this._queriesCount = [];

    this._cache = serverPreparation.cache || {root: {}};
    this._optimisticCache = this._cache;
    this._updateHandlers = [];

    this._optimisticUpdaters = {};

    this._pendingMutations = [];

    this._request = new RequestBatcher(
      networkLayer,
      serverPreparation.sessionID,
      serverPreparation.query || {},
      this,
    );
  }
  _onUpdate(fn: () => mixed) {
    this._updateHandlers.push(fn);
  }
  _offUpdate(fn: () => mixed) {
    this._updateHandlers.splice(this._updateHandlers.indexOf(fn), 1);
  }
  // called by RequestBatcher
  _handleError(err: Error) {
    setTimeout(() => { throw err; }, 0);
  }
  // called by RequestBatcher when there is new data for the cache or the list of pending mutations changes
  _handleUpdate(data: ?Object, isNew: boolean) {
    if (data) {
      this._cache = isNew ? data : mergeCache(this._cache, data);
    }
    this._optimisticCache = this._request.getPendingMutations().reduce((cache, mutation) => {
      return mergeCache(cache, mutation.applyOptimistic(cache));
    }, this._cache);
    this._updateHandlers.forEach(handler => {
      handler();
    });
  }
  _getQuery(): Object {
    return this._queries.reduce(mergeQueries, {});
  }
  _updateQuery() {
    this._request.updateQuery(this._getQuery());
  }
  _addQuery(query: Object): Promise {
    const i = this._queries.indexOf(query);
    if (i !== -1) {
      this._queriesCount[i]++;
      return;
    }
    this._queries.push(query);
    this._queriesCount.push(1);
    this._updateQuery();
  }
  _removeQuery(query: Object): Promise {
    const i = this._queries.indexOf(query);
    if (i === -1) {
      console.warn('You attempted to remove a query that does not exist.');
      return;
    }
    this._queriesCount[i]--;
    if (this._queriesCount[i] !== 0) return;
    this._queries.splice(i, 1);
    this._queriesCount.splice(i, 1);
    this._updateQuery();
  }

  queryCache(query: Object): {result: Object, loaded: boolean, errors: Array<string>} {
    return runQueryAgainstCache(this._optimisticCache, this._optimisticCache['root'], query);
  }
  query(query: Object): Promise<Object> {
    return new Promise((resolve, reject) => {
      let subscription = null;
      let done = false;
      subscription = this.subscribe(query, (result, loaded, errors) => {
        if (errors.length) {
          const err = new Error('Error fetching data for query:\n' + errors.join('\n'));
          err.code = 'BICYCLE_QUERY_ERROR';
          err.query = query;
          err.errors = errors;
          err.result = result;
          done = true;
          if (subscription) subscription.unsubscribe();
        } else if (loaded) {
          resolve(result);
          done = true;
          if (subscription) subscription.unsubscribe();
        }
      });
      if (done) subscription.unsubscribe();
    });
  }
  definieOptimisticUpdaters(updates: Object) {
    Object.keys(updates).forEach(t => {
      if (!this._optimisticUpdaters[t]) this._optimisticUpdaters[t] = {};
      Object.keys(updates[t]).forEach(k => {
        this._optimisticUpdaters[t][k] = updates[t][k];
      });
    });
  }
  update(method: string, args: Object, optimisticUpdate?: Function): Promise {
    if (!optimisticUpdate) {
      const split = method.split('.');
      optimisticUpdate = this._optimisticUpdaters[split[0]] && this._optimisticUpdaters[split[0]][split[1]];
    }
    return this._request.runMutation(new Mutation(
      method,
      args,
      optimisticUpdate,
    )).then(null, err => {
      console.error(err.message);
      throw err;
    });
  }
  subscribe(query: Object, fn: Function) {
    let lastValue = null;
    const onUpdate = () => {
      const nextValue = this.queryCache(query);
      if (lastValue === null || notEqual(lastValue, nextValue)) {
        lastValue = nextValue;
        fn(nextValue.result, nextValue.loaded, nextValue.errors);
      }
    };
    this._onUpdate(onUpdate);
    onUpdate();
    this._addQuery(query);
    return {
      unsubscribe: () => {
        this._offUpdate(onUpdate);
        if (this._options.cacheTimeout) {
          setTimeout(() => this._removeQuery(query), this._options.cacheTimeout);
        } else {
          this._removeQuery(query);
        }
      },
    };
  }
}

export default Client;
