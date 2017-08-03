import DeleteField, {isDeleteField} from './DeleteField';
import ErrorResult, {isErrorResult} from './ErrorResult';
import NodeID from './NodeID';

export type CacheDataPrimative =
  | void
  | null
  | string
  | number
  | boolean
  | ErrorResult;

// cannot include the array here as it makes this data type circular
export type CacheDataBase = CacheDataPrimative | NodeID | CacheObject;

export type CacheUpdateDataBase =
  | CacheDataPrimative
  | NodeID
  | DeleteField
  | CacheUpdateObject;

// use any here to support arbitrary nesting of arrays
export type CacheData = CacheDataBase | (CacheDataBase | any[])[];
export type CacheUpdateData = CacheUpdateDataBase | (CacheDataBase | any[])[];

export interface CacheUpdateObject {
  [name: string]: CacheUpdateData;
}

// a CacheObject can always safely be used in place of a CacheUpdateObject
export interface CacheObject extends CacheUpdateObject {
  [name: string]: CacheData;
}

export interface NodeCache extends NodeCacheUpdate {
  [id: string]: void | CacheObject;
}
interface Cache extends CacheUpdate {
  [nodeName: string]: void | NodeCache;
}
export default Cache;

export interface NodeCacheUpdate {
  [id: string]: void | CacheUpdateObject | DeleteField;
}
export interface CacheUpdate {
  [nodeName: string]: void | NodeCacheUpdate | DeleteField;
}

export function isCacheObject(
  cache: CacheUpdateData,
): cache is CacheUpdateObject;
export function isCacheObject(cache: CacheData): cache is CacheObject;
export function isCacheObject(
  cache: CacheData | CacheUpdateData,
): cache is CacheObject | CacheUpdateObject {
  return !!(
    cache &&
    typeof cache === 'object' &&
    !Array.isArray(cache) &&
    !isErrorResult(cache) &&
    !isDeleteField(cache)
  );
}
