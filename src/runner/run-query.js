import Promise from 'promise';
import typeNameFromValue from 'bicycle/utils/type-name-from-value';
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
        const subQuery = query[key];
        if (!(subQuery === true || (subQuery != null && typeof subQuery === 'object'))) {
          return {
            _type: ERROR,
            value: (
              'Expected subQuery to be "true" or an Object but got ' + typeNameFromValue(subQuery) +
              ' while getting ' + type.name + '(' + id + ').' + key
            ),
          };
        }
        return resolveField(schema, type, value, key, subQuery, context, result).then(null, err => {
          console.error(err.stack);
          return {_type: ERROR, value: err.message + ' while getting ' + type.name + '(' + id + ').' + key};
        }).then(value => {
          result[id][key] = value;
        });
      }),
    ).then(() => id);
  }, err => {
    console.error(err.stack);
    return {_type: ERROR, value: err.message + ' while getting ID of ' + type.name};
  });
}
