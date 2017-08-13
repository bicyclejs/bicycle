import Cache, {CacheData, CacheObject} from '../types/Cache';
import NodeID, {isID, getNode, createNodeID} from '../types/NodeID';
import {isErrorResult} from '../types/ErrorResult';
import {PendingOptimisticValue} from './OptimisticValueStore';

const stringify: (value: any) => string = require('stable-stringify');

function extractCacheData(
  data: CacheData,
  cache: Cache,
  resultCache: Cache,
): any {
  if (isID(data)) {
    return new BaseCache(data, cache, resultCache);
  }
  if (isErrorResult(data)) {
    return undefined;
  }
  if (Array.isArray(data)) {
    return data.map(v => extractCacheData(v, cache, resultCache));
  }
  if (data && typeof data === 'object') {
    const result = {};
    Object.keys(data).forEach(
      key => (result[key] = extractCacheData(data[key], cache, resultCache)),
    );
    return result;
  }
  return data;
}
function packageCacheData(data: any): CacheData {
  if (Array.isArray(data)) {
    return data.map(v => packageCacheData(v));
  }
  if (data && typeof data === 'object') {
    if (data instanceof BaseCache && isID(data.id)) {
      return data.id;
    }
    const result = {};
    Object.keys(data).forEach(
      key => (result[key] = packageCacheData(data[key])),
    );
    return result;
  }
  return data;
}

export type GetOptimisticValue = (name: string) => PendingOptimisticValue;

export class BaseCache {
  public readonly id: NodeID;
  private readonly _data: CacheObject;
  private readonly _cache: Cache;
  private _resultData: void | CacheObject = undefined;
  private readonly _resultCache: Cache;
  constructor(id: NodeID, cache: Cache, resultCache: Cache) {
    this.id = id;
    this._data = (cache[id.n] && cache[id.n][id.i]) || {};
    this._resultData =
      (resultCache[id.n] && resultCache[id.n][id.i]) || undefined;
    this._cache = cache;
    this._resultCache = resultCache;
  }
  get(name: string, args?: any): void | any {
    const key = args === undefined ? name : name + '(' + stringify(args) + ')';
    const result = this._resultData && this._resultData[key];
    return extractCacheData(
      result === undefined ? this._data[key] : result,
      this._cache,
      this._resultCache,
    );
  }
  set(name: string, args?: any, value?: any): this {
    const v = value === undefined ? args : value;
    const a = value === undefined ? undefined : args;
    this._resultData = getNode(this._resultCache, this.id);
    this._resultData[
      a === undefined ? name : name + '(' + stringify(a) + ')'
    ] = packageCacheData(v);
    return this;
  }
  getObject(typeName: string, id: string): BaseCache {
    const i = createNodeID(typeName, id);
    return new BaseCache(i, this._cache, this._resultCache);
  }
}

export type OptimisticUpdateHandler = (
  mutation: {objectName: string; methodName: string; args: any},
  cache: BaseCache,
  getOptimisticValue: GetOptimisticValue,
) => any;
