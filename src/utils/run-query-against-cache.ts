import Cache, {CacheData, CacheObject} from '../types/Cache';
import ErrorResult, {isErrorResult} from '../types/ErrorResult';
import {isID, getNode} from '../types/NodeID';
import Query from '../types/Query';
import freeze from './freeze';

const EMPTY_ARRAY: Array<any> = freeze([]);
let spareArray: Array<string> = [];
let spareDetailsArray: Array<ErrorResult> = [];

const EMPTY_OBJECT = {};
function getRoot(cache: Cache): CacheObject {
  const c = cache.Root;
  if (!c) return EMPTY_OBJECT;
  return c.root || EMPTY_OBJECT;
}
export default function runQueryAgainstCache(
  cache: Cache,
  query: Query,
): {
  result: Object;
  loaded: boolean;
  errors: ReadonlyArray<string>;
  errorDetails: ReadonlyArray<ErrorResult>;
} {
  let loaded = true;
  let errors = spareArray;
  let errorDetails = spareDetailsArray;
  function resolveValue(value: CacheData, subQuery: true | Query): any {
    if (value === undefined) {
      loaded = false;
      return undefined;
    } else if (isErrorResult(value)) {
      if (errors.indexOf(value.message) === -1) {
        errors.push(value.message);
      }
      errorDetails.push(value);
      return value;
    } else if (isID(value)) {
      if (subQuery === true) {
        return {};
      } else {
        return recurse(getNode(cache, value), subQuery);
      }
    } else if (Array.isArray(value)) {
      return value.map(v => resolveValue(v, subQuery));
    } else if (value && typeof value === 'object') {
      const result = {};
      Object.keys(value).forEach(key => {
        result[key] = resolveValue(value[key], subQuery);
      });
      return result;
    } else if (subQuery === true) {
      return value;
    }
  }
  function recurse(node: CacheObject, query: Query) {
    const result = {};
    Object.keys(query).forEach(key => {
      if (key[0] === '_') return;
      const cacheKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      const resultKey = / as [a-zA-Z0-9]+$/.test(key)
        ? key.split(' as ').pop() as string
        : cacheKey.split('(')[0];

      const value = node[cacheKey];
      const subQuery = query[key];
      result[resultKey] = resolveValue(value, subQuery);
    });
    return result;
  }
  const result = recurse(getRoot(cache), query);
  if (errors.length === 0) {
    errors = EMPTY_ARRAY;
    errorDetails = EMPTY_ARRAY;
  } else {
    spareArray = [];
    spareDetailsArray = [];
    errors = freeze(errors);
    errorDetails = freeze(errorDetails);
  }

  return {result, loaded, errors, errorDetails};
}
