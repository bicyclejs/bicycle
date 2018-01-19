import Cache, {
  CacheObject,
  CacheUpdate,
  CacheUpdateObject,
  NodeCache,
  NodeCacheUpdate,
  isCacheObject,
} from '../types/Cache';

function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, i) => deepEqual(val, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every(key => key in b && deepEqual(a[key], b[key]))
    );
  }
  return false;
}
function diffCacheObject(
  before: CacheObject,
  after: CacheObject,
): void | CacheUpdateObject {
  let result: void | CacheUpdateObject = undefined;
  Object.keys(after).forEach(key => {
    const beforeProp = before[key];
    const afterProp = after[key];
    if (beforeProp === afterProp) return;
    if (
      Array.isArray(beforeProp) &&
      Array.isArray(afterProp) &&
      beforeProp.length === afterProp.length &&
      beforeProp.every((val, i) => deepEqual(val, afterProp[i]))
    )
      return;
    if (isCacheObject(beforeProp) && isCacheObject(afterProp)) {
      const d = diffCacheObject(beforeProp, afterProp);
      if (d) {
        if (!result) result = {};
        result[key] = d;
      }
      return;
    }
    if (!result) result = {};
    result[key] = afterProp;
  });
  return result;
}

function diffNodeCache(
  before: NodeCache,
  after: NodeCache,
): void | NodeCacheUpdate {
  let result: void | NodeCacheUpdate = undefined;
  Object.keys(after).forEach(key => {
    const beforeValue = before[key];
    const afterValue = after[key];
    if (afterValue) {
      if (beforeValue) {
        const d = diffCacheObject(beforeValue, afterValue);
        if (d) {
          if (!result) result = {};
          result[key] = d;
        }
      } else {
        if (!result) result = {};
        result[key] = afterValue;
      }
    }
  });
  return result;
}
export default function diffCache(
  before: Cache,
  after: Cache,
): void | CacheUpdate {
  let result: void | CacheUpdate = undefined;
  Object.keys(after).forEach(key => {
    const beforeValue = before[key];
    const afterValue = after[key];
    if (afterValue) {
      if (beforeValue) {
        const d = diffNodeCache(beforeValue, afterValue);
        if (d) {
          if (!result) result = {};
          result[key] = d;
        }
      } else {
        if (!result) result = {};
        result[key] = afterValue;
      }
    }
  });
  return result;
}
