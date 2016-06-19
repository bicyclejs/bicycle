import {DELETE_FIELD} from 'bicycle/constants';

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
  });
  return {result, changed};
}
