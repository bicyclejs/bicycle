// @flow

import {DELETE_FIELD, ERROR} from '../constants';

export default function mergeCache(cache: Object, update: Object): Object {
  const result = {...cache};
  Object.keys(update).forEach(key => {
    if (cache[key] && update[key] && typeof update[key] === 'object' && !Array.isArray(update[key])) {
      if (update[key]._type === DELETE_FIELD) {
        if (key in result) delete result[key];
        return;
      }
      if (update[key]._type === ERROR) {
        result[key] = update[key];
      } else {
        result[key] = mergeCache(cache[key], update[key]);
      }
    } else {
      result[key] = update[key];
    }
  });
  return result;
}
