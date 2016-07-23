import freeze from './freeze';
import {ERROR} from '../constants';

const EMPTY_ARRAY = freeze([]);
let spareArray = [];

export default function runQueryAgainstCache(
  cache: Object,
  node: Object,
  query: Object,
): {result: Object, loaded: boolean, errors: Array<string>} {
  let loaded = true;
  let errors = spareArray;
  function recurse(node, query) {
    const result = {};
    Object.keys(query).forEach(key => {
      if (key[0] === '_') return;
      const cacheKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      const resultKey = / as [a-zA-Z0-9]+$/.test(key) ? key.split(' as ').pop() : cacheKey.split('(')[0];
      if (node[cacheKey] === undefined) {
        loaded = false;
        result[resultKey] = undefined;
      } else if (node[cacheKey] && typeof node[cacheKey] === 'object' && node[cacheKey]._type === ERROR) {
        errors.push(node[cacheKey].value);
        result[resultKey] = node[cacheKey];
      } else if (query[key] === true) {
        result[resultKey] = node[cacheKey];
      } else if (Array.isArray(node[cacheKey])) {
        result[resultKey] = node[cacheKey].map(id => {
          if (id === null) return null;
          if (!cache[id]) {
            throw new Error('Missing ' + id + ' object from cache');
          }
          return recurse(cache[id], query[key]);
        });
      } else {
        if (node[cacheKey] === null) {
          result[resultKey] = null;
          return;
        }
        if (!cache[node[cacheKey]]) {
          throw new Error('Missing ' + node[cacheKey] + ' object from cache');
        }
        result[resultKey] = recurse(cache[node[cacheKey]], query[key]);
      }
    });
    return result;
  }
  const result = recurse(node, query);
  if (errors.length === 0) {
    errors = EMPTY_ARRAY;
  } else {
    spareArray = [];
    errors = freeze(errors);
  }
  // TODO: work around for https://github.com/codemix/babel-plugin-typecheck/issues/155
  const res = {result, loaded, errors};
  return res;
}
