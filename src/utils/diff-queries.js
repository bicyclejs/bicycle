export default function diffQueries(oldQuery: Object, newQuery: Object) {
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
    } else if (typeof oldQuery[key] !== typeof newQuery[key]) {
      result[key] = newQuery[key];
      updated = true;
    } else if (oldQuery[key] !== newQuery[key]) {
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
