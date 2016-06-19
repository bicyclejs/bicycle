import resolveField from './resolve-field';
import {ERROR} from '../constants';

export default function run(
  schema: Object,
  type: Object,
  value: any,
  query: Object,
  context: any,
  result: Object,
): Promise<string | {_type: 'ERROR', value: string}> {
  // TODO: verify "query" is actually an Object
  return Promise.resolve(null).then(() => type.id(value)).then(id => {
    if (!result[id]) result[id] = {};
    return Promise.all(
      Object.keys(query).map(key => {
        return resolveField(schema, type, value, key, query[key], context, result).then(null, err => {
          return {_type: ERROR, value: err.message + ' while getting ' + type.name + '(' + id + ').' + key};
        }).then(value => {
          result[id][key] = value;
        });
      }),
    ).then(() => id);
  }, err => {
    return {_type: ERROR, value: err.message + ' while getting ID of ' + type.name};
  });
}
