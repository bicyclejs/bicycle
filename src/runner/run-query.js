// @flow

import type {ErrorInterface, ErrorResult, Logging, ObjectType, Query, Schema, TypeDefinition} from '../flow-types';

import Promise from 'promise';
import typeNameFromValue from '../utils/type-name-from-value';
import resolveField from './resolve-field';
import {ERROR} from '../constants';
import reportError from '../error-reporting';

function getErrorObject(err: ErrorInterface, context: string, logging: Logging): ErrorResult {
  const result = (
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
  err.message += ' ' + context;
  reportError(err, logging);
  return result;
}
function isCached(result, id, key, subQuery) {
  if (result[id][key] === undefined) {
    return false;
  }
  if (subQuery === true) {
    return true;
  }
  const subID = result[id][key];
  if (!result[subID]) {
    return false;
  }
  const keys = Object.keys(subQuery);
  for (let i = 0; i < keys.length; i++) {
    if (!isCached(result, subID, keys[i], subQuery[keys[i]])) {
      return false;
    }
  }
  return true;
}
export default function run(
  schema: Schema,
  logging: Logging,
  type: ObjectType,
  value: any,
  query: Query,
  context: any,
  result: Object,
): Promise<string | ErrorResult> {
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
        if (isCached(result, id, key, subQuery)) {
          return;
        }
        return resolveField(schema, logging, type, value, key, subQuery, context, result).then(null, err => {
          return getErrorObject(err, 'while getting ' + type.name + '(' + id + ').' + key, logging);
        }).then(value => {
          result[id][key] = value;
        });
      }),
    ).then(() => id);
  }, err => {
    return getErrorObject(err, 'while getting ID of ' + type.name, logging);
  });
}
