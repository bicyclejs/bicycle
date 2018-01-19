import Cache, {CacheUpdate} from '../types/Cache';
import Query from '../types/Query';
import ServerPreparation from '../types/ServerPreparation';
import NetworkLayerInterface from '../types/NetworkLayerInterface';
import createError from '../utils/create-error';
import mergeQueries from '../utils/merge-queries';
import runQueryAgainstCache, {
  QueryCacheResult,
} from '../utils/run-query-against-cache';
import notEqual from '../utils/not-equal';
import mergeCache from '../utils/merge-cache';
import NetworkLayer from '../network-layer';
import RequestBatcher from './request-batcher';
import Mutation from './mutation';
import ErrorResult from '../types/ErrorResult';
import {OptimisticUpdateHandler, BaseCache} from './optimistic';
import OptimisticValueStore from './OptimisticValueStore';
import {createNodeID} from '../types/NodeID';
import {BaseRootQuery, Mutation as TypedMutation} from '../typed-helpers/query';

declare const BICYCLE_SERVER_PREPARATION: ServerPreparation | void;

export {
  NetworkLayer,
  NetworkLayerInterface as INetworkLayer,
  QueryCacheResult,
  createNodeID,
};

export type ClientOptions = {
  networkLayer?: NetworkLayerInterface;
  serverPreparation?: ServerPreparation;
  cacheTimeout?: number;
};
export interface Subscription {
  unsubscribe: () => void;
}
class Client<
  OptimisticUpdatersType = {
    [typeName: string]: {[mutationName: string]: OptimisticUpdateHandler};
  }
> {
  private readonly _options: ClientOptions;

  private _cache: Cache;
  private _optimisticCache: Cache;

  private readonly _optimisticValueStore: OptimisticValueStore = new OptimisticValueStore();

  private readonly _queries: Query[] = [];
  private readonly _queriesCount: number[] = [];
  private readonly _updateHandlers: (() => any)[] = [];
  private readonly _networkErrorHandlers: ((err: Error) => any)[] = [];
  private readonly _mutationErrorHandlers: ((err: Error) => any)[] = [];
  private readonly _queueRequestHandlers: (() => any)[] = [];
  private readonly _successfulResponseHandlers: ((
    pendingMutations: number,
  ) => any)[] = [];

  private readonly _optimisticUpdaters: {
    [typeName: string]: void | {
      [mutationName: string]: void | OptimisticUpdateHandler;
    };
  } = {};
  private readonly _request: RequestBatcher;

  constructor(options: ClientOptions = {}) {
    this._options = options;
    const serverPreparation =
      options.serverPreparation !== undefined
        ? options.serverPreparation
        : typeof BICYCLE_SERVER_PREPARATION !== 'undefined'
          ? BICYCLE_SERVER_PREPARATION
          : undefined;

    this._cache =
      (serverPreparation && serverPreparation.c) ||
      ({Root: {root: {}}} as Cache);
    this._optimisticCache = this._cache;

    this._request = new RequestBatcher(
      options.networkLayer === undefined
        ? new NetworkLayer()
        : options.networkLayer,
      serverPreparation,
      this,
    );
  }
  private _onUpdate(fn: () => any) {
    this._updateHandlers.push(fn);
  }
  private _offUpdate(fn: () => any) {
    this._updateHandlers.splice(this._updateHandlers.indexOf(fn), 1);
  }
  // called by RequestBatcher, these errors are always retried and are usually temporary
  _handleNetworkError(err: Error) {
    (err as any).code = 'NETWORK_ERROR';
    setTimeout(() => {
      throw err;
    }, 0);
    this._networkErrorHandlers.forEach(handler => {
      handler(err);
    });
  }
  // called by RequestBatcher, these errors are not retried
  _handleMutationError(err: Error) {
    setTimeout(() => {
      throw err;
    }, 0);
    this._mutationErrorHandlers.forEach(handler => {
      handler(err);
    });
  }
  _handleQueueRequest() {
    this._queueRequestHandlers.forEach(handler => {
      handler();
    });
  }
  _handleSuccessfulResponse(pendingMutations: number) {
    this._successfulResponseHandlers.forEach(handler => {
      handler(pendingMutations);
    });
  }
  _handleNewSession(data: Cache) {
    this._cache = data;
    this._updateOptimistCache();
  }
  // called by RequestBatcher when there is new data for the cache or the list of pending mutations changes
  _handleUpdate(data: void | CacheUpdate) {
    if (data) {
      this._cache = mergeCache(this._cache, data);
    }
    this._updateOptimistCache();
  }
  private _updateOptimistCache() {
    const pendingMutations = this._request.getPendingMutations();
    if (pendingMutations.length) {
      const result = {};
      const cache = new BaseCache(
        createNodeID('Root', 'root'),
        this._cache,
        result,
      );
      pendingMutations.forEach(mutation => mutation.applyOptimistic(cache));
      this._optimisticCache = mergeCache(this._cache, result);
    } else {
      this._optimisticCache = this._cache;
    }
    this._updateHandlers.forEach(handler => {
      handler();
    });
  }
  private _getQuery(): Query {
    if (this._queries.length === 0) return {};
    return mergeQueries(...this._queries);
  }
  private _updateQuery() {
    this._request.updateQuery(this._getQuery());
  }
  private _addQuery(query: Query) {
    const i = this._queries.indexOf(query);
    if (i !== -1) {
      this._queriesCount[i]++;
      return;
    }
    this._queries.push(query);
    this._queriesCount.push(1);
    this._updateQuery();
  }
  private _removeQuery(query: Query) {
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

  queryCache<TResult>(query: BaseRootQuery<TResult>): QueryCacheResult<TResult>;
  queryCache(query: Query): QueryCacheResult<any>;
  queryCache(query: Query | BaseRootQuery<any>): QueryCacheResult<any> {
    return runQueryAgainstCache(
      this._optimisticCache,
      query instanceof BaseRootQuery ? query._query : query,
    );
  }
  query<TResult>(query: BaseRootQuery<TResult>): Promise<TResult>;
  query(query: Query): Promise<any>;
  query(query: Query | BaseRootQuery<any>): Promise<any> {
    const q = query instanceof BaseRootQuery ? query._query : query;
    return new Promise((resolve, reject) => {
      let subscription: null | Subscription = null;
      let done = false;
      subscription = this.subscribe(q, (result, loaded, errors) => {
        if (errors.length) {
          const err = createError(
            'Error fetching data for query:\n' + errors.join('\n'),
            {
              code: 'BICYCLE_QUERY_ERROR',
              query: q,
              errors,
              result,
            },
          );
          reject(err);
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
  defineOptimisticUpdaters(updates: OptimisticUpdatersType) {
    const u = updates as any;
    Object.keys(u).forEach(t => {
      if (!this._optimisticUpdaters[t]) this._optimisticUpdaters[t] = {};
      Object.keys(u[t]).forEach(k => {
        this._optimisticUpdaters[t][k] = u[t][k];
      });
    });
  }
  update<TResult>(mutation: TypedMutation<TResult>): Promise<TResult>;
  update(
    method: string,
    args: any,
    optimisticUpdate?: OptimisticUpdateHandler,
  ): Promise<any>;
  update(
    method: string | TypedMutation<any>,
    args?: any,
    optimisticUpdate?: OptimisticUpdateHandler,
  ): Promise<any> {
    // TODO: share a single "Mutation" class
    const m = method instanceof TypedMutation ? method._name : method;
    const a = method instanceof TypedMutation ? method._args : args;
    let o =
      method instanceof TypedMutation
        ? method._optimisticUpdate
        : optimisticUpdate;
    if (!o) {
      const split = m.split('.');
      o =
        this._optimisticUpdaters[split[0]] &&
        this._optimisticUpdaters[split[0]][split[1]];
    }
    return this._request.runMutation(
      new Mutation(m, a, o, this._optimisticValueStore),
    );
  }
  subscribe<TResult>(
    query: BaseRootQuery<TResult>,
    fn: (
      result: TResult,
      loaded: boolean,
      errors: ReadonlyArray<string>,
      errorDetails: ReadonlyArray<ErrorResult>,
    ) => any,
  ): Subscription;
  subscribe(
    query: Query,
    fn: (
      result: any,
      loaded: boolean,
      errors: ReadonlyArray<string>,
      errorDetails: ReadonlyArray<ErrorResult>,
    ) => any,
  ): Subscription;
  subscribe(
    query: Query | BaseRootQuery<any>,
    fn: (
      result: any,
      loaded: boolean,
      errors: ReadonlyArray<string>,
      errorDetails: ReadonlyArray<ErrorResult>,
    ) => any,
  ): Subscription {
    const q = query instanceof BaseRootQuery ? query._query : query;
    let lastValue: any = null;
    const onUpdate = () => {
      const nextValue = this.queryCache(q);
      if (lastValue === null || notEqual(lastValue, nextValue)) {
        lastValue = nextValue;
        fn(
          nextValue.result,
          nextValue.loaded,
          nextValue.errors,
          nextValue.errorDetails,
        );
      }
    };
    this._onUpdate(onUpdate);
    onUpdate();
    this._addQuery(q);
    return {
      unsubscribe: () => {
        this._offUpdate(onUpdate);
        if (this._options.cacheTimeout) {
          setTimeout(() => this._removeQuery(q), this._options.cacheTimeout);
        } else {
          this._removeQuery(q);
        }
      },
    };
  }
  subscribeToNetworkErrors(fn: (err: Error) => any): Subscription {
    this._networkErrorHandlers.push(fn);
    return {
      unsubscribe: () => {
        this._networkErrorHandlers.splice(
          this._networkErrorHandlers.indexOf(fn),
          1,
        );
      },
    };
  }
  subscribeToMutationErrors(fn: (err: Error) => any): Subscription {
    this._mutationErrorHandlers.push(fn);
    return {
      unsubscribe: () => {
        this._mutationErrorHandlers.splice(
          this._mutationErrorHandlers.indexOf(fn),
          1,
        );
      },
    };
  }
  subscribeToQueueRequest(fn: () => any): Subscription {
    this._queueRequestHandlers.push(fn);
    return {
      unsubscribe: () => {
        this._queueRequestHandlers.splice(
          this._queueRequestHandlers.indexOf(fn),
          1,
        );
      },
    };
  }
  subscribeToSuccessfulResponse(
    fn: (pendingMutations: number) => any,
  ): Subscription {
    this._successfulResponseHandlers.push(fn);
    return {
      unsubscribe: () => {
        this._successfulResponseHandlers.splice(
          this._successfulResponseHandlers.indexOf(fn),
          1,
        );
      },
    };
  }
}

export default Client;
