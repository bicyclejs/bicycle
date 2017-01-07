// @flow

import freeze from './freeze';
import {ERROR} from '../constants';

const EMPTY_ARRAY: Array<any> = freeze([]);
let spareArray: Array<string> = [];
let spareDetailsArray: Array<Object> = [];

export default function runQueryAgainstCache(
  cache: Object,
  node: Object,
  query: Object,
): {result: Object, loaded: boolean, errors: Array<string>, errorDetails: Array<Object>} {
  let loaded = true;
  let errors = spareArray;
  let errorDetails = spareDetailsArray;
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
        if (errors.indexOf(node[cacheKey].value) === -1) {
          errors.push(node[cacheKey].value);
        }
        errorDetails.push(node[cacheKey]);
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
    errorDetails = EMPTY_ARRAY;
  } else {
    spareArray = [];
    spareDetailsArray = [];
    errors = freeze(errors);
    errorDetails = freeze(errorDetails);
  }

  return {result, loaded, errors, errorDetails};
}
