// @public

import Promise from 'promise';
import mergeQueries from 'bicycle/utils/merge-queries';
import runQueryAgainstCache from 'bicycle/utils/run-query-against-cache';
import notEqual from 'bicycle/utils/not-equal';
import mergeCache from 'bicycle/utils/merge-cache';
import DefaultNetworkLayer from 'bicycle/network-layer';
import RequestBatcher from './request-batcher';

function noop() {}
class Client {
  constructor(
    networkLayer: {batch: Function} = new DefaultNetworkLayer(),
    serverPreparation: {sessionID?: string, query?: Object, cache?: Object} = {},
    options = {}
  ) {
    this._options = options;

    this._queries = [];
    this._queriesCount = [];

    this._cache = serverPreparation.cache || {root: {}};
    this._optimisticCache = {root: {}};
    this._updateHandlers = [];

    this._optimisticUpdaters = {};

    this._pendingMutations = [];

    this._request = new RequestBatcher(
      networkLayer,
      serverPreparation.sessionID,
      serverPreparation.query || {},
      this,
    );

    this._syncUpdate();
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
  // called by RequestBatcher
  _handleUpdate(data: Object, isNew: boolean, mutationsProcessed: number) {
    this._pendingMutations.splice(0, mutationsProcessed);
    this._cache = isNew ? data : mergeCache(this._cache, data);
    this._syncUpdate();
  }
  _syncUpdate() {
    clearTimeout(this._updateTimeout);
    this._optimisticCache = this._pendingMutations.reduce((cache, update) => {
      return mergeCache(cache, update.optimisticUpdate(cache));
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
  definieOptimisticUpdaters(updates: Object) {
    Object.keys(updates).forEach(t => {
      if (!this._optimisticUpdaters[t]) this._optimisticUpdaters[t] = {};
      Object.keys(updates[t]).forEach(k => {
        this._optimisticUpdaters[t][k] = updates[t][k];
      });
    });
  }
  update(method: string, args: Object, optimisticUpdate?: Function): Promise {
    const mutation = {method, args};
    if (!optimisticUpdate) {
      const split = method.split('.');
      optimisticUpdate = this._optimisticUpdaters[split[0]] && this._optimisticUpdaters[split[0]][split[1]];
    }
    this._pendingMutations.push(optimisticUpdate || noop);
    const result = this._request.runMutation(mutation);
    this._syncUpdate();
    return result;
  }
  subscribe(query: Object, fn: Function) {
    let lastValue = this.queryCache(query);
    fn(lastValue.result, !lastValue.notLoaded);
    const onUpdate = () => {
      const nextValue = this.queryCache(query);
      if (notEqual(lastValue, nextValue)) {
        lastValue = nextValue;
        fn(nextValue.result, nextValue.loaded, nextValue.errors);
      }
    };
    this._onUpdate(onUpdate);
    onUpdate();
    this._addQuery(query);
    return {
      loaded: this.addQuery(query),
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
