import Query, {QueryUpdate} from '../types/Query';

export default function diffQueries(
  oldQuery: Query,
  newQuery: Query,
): QueryUpdate | void {
  let result: {[key: string]: boolean | QueryUpdate} | void = undefined;
  Object.keys(oldQuery).forEach(key => {
    if (key[0] === '_') return;
    if (oldQuery[key] && !newQuery[key]) {
      if (!result) result = {};
      result[key] = false;
    }
  });
  Object.keys(newQuery).forEach(key => {
    if (key[0] === '_') return;
    const oldV = oldQuery[key];
    const newV = newQuery[key];
    if (!oldV) {
      if (!result) result = {};
      result[key] = newV;
    } else if (typeof oldV !== typeof newV) {
      if (!result) result = {};
      result[key] = newV;
    } else if (
      oldV !== newV &&
      typeof oldV === 'object' &&
      typeof newV === 'object'
    ) {
      const d = diffQueries(oldV, newV);
      if (d !== undefined) {
        if (!result) result = {};
        result[key] = d;
      }
    }
  });
  return result;
}
