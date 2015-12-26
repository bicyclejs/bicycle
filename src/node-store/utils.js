export const MUTATE = 'MUTATE';
export const UPDATE_QUERY = 'UPDATE_QUERY';
export const LOADING = {loading: true};
export const DELETE_FIELD = 'DELETE_FIELD';

export function mergeQueries(a, b) {
  const result = {};
  Object.keys(a).forEach(key => {
    if (key[0] === '_') return;
    result[key] = a[key];
  });
  Object.keys(b).forEach(key => {
    if (key[0] === '_') return;
    const resultKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
    if (!result[resultKey]) {
      result[resultKey] = b[key];
    } else {
      result[resultKey] = mergeQueries(result[resultKey], b[key]);
    }
  });
  return result;
}

export function diffQueries(oldQuery, newQuery) {
  const result = {};
  let updated = false;
  Object.keys(oldQuery).forEach(key => {
    if (key[0] === '_') return;
    if (oldQuery[key] && !newQuery[key]) {
      result[key] = false;
      updated = true;
    }
  });
  Object.keys(newQuery).forEach(key => {
    if (key[0] === '_') return;
    if (!oldQuery[key]) {
      result[key] = newQuery[key];
      updated = true;
    } else {
      const d = diffQueries(oldQuery[key], newQuery[key]);
      if (d !== undefined) {
        result[key] = d;
        updated = true;
      }
    }
  });
  if (!updated) return undefined;
  return result;
}

export function runQueryAgainstCache(cache, node, query) {
  let notLoaded = false;
  function recurse(node, query) {
    const result = {};
    Object.keys(query).forEach(key => {
      if (key[0] === '_') return;
      const cacheKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      const resultKey = / as [a-zA-Z0-9]+$/.test(key) ? key.split(' as ').pop() : cacheKey;
      if (node[cacheKey] === undefined) {
        notLoaded = true;
        result[resultKey] = LOADING;
      } else if (query[key] === true) {
        result[resultKey] = node[cacheKey];
      } else if (Array.isArray(node[cacheKey])) {
        result[resultKey] = node[cacheKey].map(id => recurse(cache[id], query[key]));
      } else {
        result[resultKey] = recurse(cache[node[cacheKey]], query[key]);
      }
    });
    return result;
  }
  const result = recurse(node, query);
  return {result, notLoaded};
}

export function areDifferent(oldValue, newValue) {
  return Object.keys(oldValue).some(key => {
    if (oldValue[key] === newValue[key]) return false;
    if (oldValue[key] && newValue[key]) {
      if (
        Array.isArray(oldValue[key]) &&
        Array.isArray(newValue[key]) &&
        oldValue[key].length === newValue[key].length
      ) {
        return oldValue[key].some((val, i) => {
          if (val === newValue[key][i]) return false;
          if (val && newValue[key][i] && typeof val === 'object' && typeof newValue[key][i] === 'object') {
            return areDifferent(val, newValue[key][i]);
          }
          return true;
        });
      }
      if (!Array.isArray(oldValue[key]) && typeof oldValue[key] === 'object' && typeof newValue[key] === 'object') {
        return areDifferent(oldValue[key], newValue[key]);
      }
    }
    return true;
  }) || Object.keys(newValue).some(key => !(key in oldValue));
}

export function mergeCache(cache, update) {
  const result = {...cache};
  Object.keys(update).forEach(key => {
    if (cache[key] && update[key] && typeof update[key] === 'object' && !Array.isArray(update[key])) {
      if (update[key]._type === DELETE_FIELD) return;
      result[key] = mergeCache(cache[key], update[key]);
    } else {
      result[key] = update[key];
    }
  });
  return result;
}

export function diffCache(before, after) {
  const result = {};
  let changed = false;
  Object.keys(after).forEach(key => {
    if (before[key] === after[key]) return;
    if (
      Array.isArray(before[key]) && Array.isArray(after[key]) &&
      before[key].length === after[key].length &&
      before[key].every((val, i) => val === after[key][i])
    ) return;
    if (before[key] && after[key] && typeof after[key] === 'object' && !Array.isArray(after[key])) {
      const {result: d, changed: c} = diffCache(before[key], after[key]);
      if (c) {
        changed = true;
        result[key] = d;
      }
    } else {
      changed = true;
      result[key] = after[key];
    }
  });
  Object.keys(before).forEach(key => {
    if (!(key in after)) {
      changed = true;
      result[key] = {_type: DELETE_FIELD};
    }
  })
  return {result, changed};
}
