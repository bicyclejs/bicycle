import Cache, {
  CacheObject,
  CacheUpdate,
  CacheUpdateObject,
  NodeCache,
  NodeCacheUpdate,
  isCacheObject,
} from '../types/Cache';
import {createDeleteField} from '../types/DeleteField';

function diffCacheObject(
  before: CacheObject,
  after: CacheObject,
): void | CacheUpdateObject {
  let result: void | CacheUpdateObject = undefined;
  Object.keys(before).forEach(key => {
    if (after[key] === undefined) {
      if (!result) result = {};
      result[key] = createDeleteField();
    }
  });
  Object.keys(after).forEach(key => {
    const beforeProp = before[key];
    const afterProp = after[key];
    if (beforeProp === afterProp) return;
    if (
      Array.isArray(beforeProp) &&
      Array.isArray(afterProp) &&
      beforeProp.length === afterProp.length &&
      beforeProp.every((val, i) => val === afterProp[i])
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
  Object.keys(before).forEach(key => {
    if (!after[key]) {
      if (!result) result = {};
      result[key] = createDeleteField();
    }
  });
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
  Object.keys(before).forEach(key => {
    if (!after[key]) {
      if (!result) result = {};
      result[key] = createDeleteField();
    }
  });
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
