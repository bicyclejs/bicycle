import Promise from 'promise';
import typeNameFromValue from 'bicycle/utils/type-name-from-value';
import resolveField from './resolve-field';
import {ERROR} from '../constants';

function getErrorObject(err, context) {
  return (
    process.env.NODE_ENV === 'production' && !err.exposeProd
    ? {
      _type: ERROR,
      value: (
        'An unexpected error was encountered ' + context +
        ' (if you are the developer of this app, you can set "NODE_ENV" to "development" to expose the full error)'
      ),
      data: {},
      code: 'PRODUCTION_ERROR',
    }
    : {
      _type: ERROR,
      value: err.message + ' ' + context,
      data: err.data || {},
      code: err.code,
    }
  );
}
export default function run(
  schema: Object,
  type: Object,
  value: any,
  query: Object,
  context: any,
  result: Object,
): Promise<string | {_type: 'ERROR', value: string}> {
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
            data: {},
            code: 'INVALID_SUB_QUERY',
          };
        }
        return resolveField(schema, type, value, key, subQuery, context, result).then(null, err => {
          console.error(err.stack);
          return getErrorObject(err, 'while getting ' + type.name + '(' + id + ').' + key);
        }).then(value => {
          result[id][key] = value;
        });
      }),
    ).then(() => id);
  }, err => {
    console.error(err.stack);
    return getErrorObject(err, 'while getting ID of ' + type.name);
  });
}
