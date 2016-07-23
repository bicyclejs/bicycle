export default function mergeQueries(firstQuery: Object, ...queries): Object {
  const result = {};
  Object.keys(firstQuery).forEach(key => {
    if (key[0] === '_') return;
    result[key] = firstQuery[key];
  });
  for (const query of queries) {
    Object.keys(query).forEach(key => {
      if (key[0] === '_') return;
      const resultKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      if (query[key] === false) {
        if (resultKey in result) delete result[resultKey];
      } else if (query[key] === true) {
        result[resultKey] = query[key];
      } else {
        result[resultKey] = mergeQueries(result[resultKey] || {}, query[key]);
      }
    });
  }
  return result;
}
