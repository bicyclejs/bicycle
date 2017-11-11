import Cache, {CacheData, CacheObject} from '../types/Cache';
import {isErrorResult} from '../types/ErrorResult';
import NodeID, {isID, getNodeIfExists} from '../types/NodeID';
import Query from '../types/Query';

export default function isCached(
  cache: Cache,
  nodeID: NodeID,
  key: string,
  query: true | Query,
): boolean {
  function resolveValue(value: CacheData, subQuery: true | Query): boolean {
    if (value === undefined) {
      return false;
    } else if (isErrorResult(value)) {
      return true;
    } else if (isID(value)) {
      if (subQuery === true) {
        return true;
      } else {
        return recurse(getNodeIfExists(cache, value), subQuery);
      }
    } else if (Array.isArray(value)) {
      return value.every(v => resolveValue(v, subQuery));
    } else if (value && typeof value === 'object') {
      return Object.keys(value).every(key =>
        resolveValue(value[key], subQuery),
      );
    }
    return true;
  }
  function recurse(node: CacheObject | null, query: Query): boolean {
    if (!node) {
      return false;
    }
    return Object.keys(query).every(key => {
      if (key[0] === '_') return true;
      const cacheKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      const value = node[cacheKey];
      const subQuery = query[key];
      return resolveValue(value, subQuery);
    });
  }

  const entryNode = getNodeIfExists(cache, nodeID);
  if (!entryNode) {
    return false;
  }
  return resolveValue(entryNode[key], query);
}
