// @flow

export default function diffQueries(oldQuery: Object, newQuery: Object): Object | void {
  let result;
  Object.keys(oldQuery).forEach(key => {
    if (key[0] === '_') return;
    if (oldQuery[key] && !newQuery[key]) {
      if (!result) result = {};
      result[key] = false;
    }
  });
  Object.keys(newQuery).forEach(key => {
    if (key[0] === '_') return;
    if (!oldQuery[key]) {
      if (!result) result = {};
      result[key] = newQuery[key];
    } else if (typeof oldQuery[key] !== typeof newQuery[key]) {
      if (!result) result = {};
      result[key] = newQuery[key];
    } else if (oldQuery[key] !== newQuery[key]) {
      const d = diffQueries(oldQuery[key], newQuery[key]);
      if (d !== undefined) {
        if (!result) result = {};
        result[key] = d;
      }
    }
  });
  return result;
}
