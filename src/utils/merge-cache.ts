import Cache, {
  CacheUpdate,
  CacheObject,
  CacheUpdateObject,
  NodeCache,
  NodeCacheUpdate,
  isCacheObject,
} from '../types/Cache';
import {isDeleteField} from '../types/DeleteField';
import {isErrorResult} from '../types/ErrorResult';

const EMPTY_OBJECT = {};
function mergeCacheObject(
  cache: CacheObject,
  update: CacheUpdateObject,
): CacheObject {
  const result: CacheObject = {};
  if (cache !== EMPTY_OBJECT) {
    Object.keys(cache).forEach(key => {
      if (!isDeleteField(update[key])) {
        result[key] = cache[key];
      }
    });
  }
  Object.keys(update).forEach(key => {
    const c = cache[key];
    const u = update[key];
    if (isDeleteField(u)) {
      // do nothing
    } else if (isErrorResult(u)) {
      result[key] = u;
    } else if (isCacheObject(u)) {
      if (isCacheObject(c)) {
        result[key] = mergeCacheObject(c, u);
      } else {
        result[key] = mergeCacheObject(EMPTY_OBJECT, u);
      }
    } else {
      result[key] = u;
    }
  });
  return result;
}

function mergeNodeCache(cache: NodeCache, update: NodeCacheUpdate): NodeCache {
  const result: NodeCache = {};
  if (cache !== EMPTY_OBJECT) {
    Object.keys(cache).forEach(key => {
      if (!isDeleteField(update[key])) {
        result[key] = cache[key];
      }
    });
  }
  Object.keys(update).forEach(id => {
    const v = update[id];
    if (v && !isDeleteField(v)) {
      result[id] = mergeCacheObject(cache[id] || EMPTY_OBJECT, v);
    }
  });
  return result;
}

export default function mergeCache(cache: Cache, update: CacheUpdate): Cache {
  const result: Cache = {};
  Object.keys(cache).forEach(key => {
    if (!isDeleteField(update[key])) {
      result[key] = cache[key];
    }
  });
  Object.keys(update).forEach(typeName => {
    const v = update[typeName];
    if (v && !isDeleteField(v)) {
      result[typeName] = mergeNodeCache(cache[typeName] || EMPTY_OBJECT, v);
    }
  });
  return result;
}
