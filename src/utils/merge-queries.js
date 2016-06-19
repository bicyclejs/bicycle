export default function mergeQueries(a, b) {
  const result = {};
  Object.keys(a).forEach(key => {
    if (key[0] === '_') return;
    result[key] = a[key];
  });
  Object.keys(b).forEach(key => {
    if (key[0] === '_') return;
    const resultKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
    if (b[key] === false) {
      if (resultKey in result) delete result[resultKey];
    } else if (b[key] === true) {
      result[resultKey] = b[key];
    } else {
      result[resultKey] = mergeQueries(result[resultKey] || {}, b[key]);
    }
  });
  return result;
}
