import Query, {QueryUpdate} from '../types/Query';

export default function mergeQueries(...queries: Array<QueryUpdate>): Query {
  const result = {};
  for (const query of queries) {
    Object.keys(query).forEach(key => {
      if (key[0] === '_') return;
      const resultKey = key.replace(/ as [a-zA-Z0-9]+$/, '');
      const q = query[key];
      if (q === false) {
        if (resultKey in result) delete result[resultKey];
      } else if (q === true) {
        result[resultKey] = query[key];
      } else if (q && typeof q === 'object') {
        result[resultKey] = mergeQueries(result[resultKey] || {}, q);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(
            'Invalid type in query ' +
              require('util').inspect(query) +
              ', queries should match `{[key: string]: boolean}`',
          );
        }
        throw new Error(
          'Invalid type in query ' +
            query +
            ', queries should match `{[key: string]: boolean}`',
        );
      }
    });
  }
  return result;
}
