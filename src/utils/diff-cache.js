import {DELETE_FIELD, ERROR} from 'bicycle/constants';

export default function diffCache(before: Object, after: Object): ?Object {
  let result;
  Object.keys(after).forEach(key => {
    if (before[key] === after[key]) return;
    if (
      Array.isArray(before[key]) && Array.isArray(after[key]) &&
      before[key].length === after[key].length &&
      before[key].every((val, i) => val === after[key][i])
    ) return;
    if (
      before[key] &&
      after[key] &&
      typeof before[key] === 'object' &&
      typeof after[key] === 'object' &&
      !Array.isArray(before[key]) &&
      !Array.isArray(after[key]) &&
      before[key]._type !== ERROR &&
      after[key]._type !== ERROR
    ) {
      const d = diffCache(before[key], after[key]);
      if (d) {
        if (!result) result = {};
        result[key] = d;
      }
      return;
    }
    if (!result) result = {};
    result[key] = after[key];
  });
  Object.keys(before).forEach(key => {
    if (after[key] === undefined) {
      if (!result) result = {};
      result[key] = {_type: DELETE_FIELD};
    }
  });
  return result;
}
