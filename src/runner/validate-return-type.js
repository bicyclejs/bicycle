// @flow

import type {Logging, Query, Schema, TypeDefinition} from '../flow-types';
import Promise from 'promise';
import typeString from '../utils/type-name-from-definition';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';
import suggestMatch from '../utils/suggest-match';
import runQuery from './run-query';

const error = new TypeError('Unexpected type');
const BICYCLE_MUTATION_CONTEXT = {};

// declare this so that flow-runtime ignores T
type T = mixed;
function throwIfNull<T>(result: ?T): T {
  if (result === null || result === undefined) {
    throw error;
  }
  return result;
}
function checkReturnTypeInner(
  schema: Schema,
  logging: Logging,
  type: TypeDefinition,
  value: any,
  subQuery: ?Query,
  context: any,
  result: Object,
) {
  switch (type.kind) {
    case 'NotNull':
      if (value === null || value === undefined) {
        throw error;
      }
      return Promise.resolve(
        checkReturnTypeInner(schema, logging, type.type, value, subQuery, context, result),
      ).then(throwIfNull);
    case 'List':
      if (value === null || value === undefined) return null;
      const subType = type.type;
      if (!Array.isArray(value)) {
        throw error;
      }
      return Promise.all(value.map((v, i) => checkReturnTypeInner(schema, logging, subType, v, subQuery, context, result)));
    case 'ObjectScalar':
      const properties = type.properties;
      if (typeof value !== 'object') {
        throw error;
      }
      Object.keys(value).forEach(key => {
        if (!(key in properties)) {
          const suggestion = suggestMatch(Object.keys(properties), key);
          throw new TypeError(`Unrecognised key ${key} in mutation result${suggestion}`);
        }
      });
      const output = {};
      return Promise.all(
        Object.keys(properties).map(key => {
          return Promise.resolve(
            checkReturnTypeInner(schema, logging, properties[key], value[key], subQuery, context, result),
          ).then(v => {
            output[key] = v;
          });
        }),
      ).then(() => output);
    case 'NamedTypeReference':
      if (value === null || value === undefined) return null;
      const namedType = schema[type.value];
      if (!namedType) throw new Error('Unrecognized type ' + type.value);
      switch (namedType.kind) {
        case 'NodeType':
          if (context === BICYCLE_MUTATION_CONTEXT) {
            throw new TypeError(
              'You cannot return a non-scalar (e.g. ' + namedType.name + ') object from a mutation.'
            );
          }
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw error;
          }
          if (!(subQuery != null && typeof subQuery === 'object')) {
            throw createError(
              'You must provide an object to indicate which fields of the node "' + namedType.name +
              '" you want to query',
              {exposeProd: true, code: 'INVALID_QUERY', data: {typeName: namedType.name}},
            );
          }
          return runQuery(schema, logging, namedType, value, subQuery, context, result);
        case 'ScalarType':
          try {
            return namedType.serialize(value);
          } catch (ex) {
            throw error;
          }
        default:
          throw new TypeError('Unrecognised named type kind ' + namedType.kind);
      }
    default:
      throw new TypeError('Unrecognised field type kind ' + type.kind);
  }
}


export default function validateReturnType(
  schema: Schema,
  logging: Logging,
  type: TypeDefinition,
  value: any,
  subQuery: ?Query,
  context: any,
  result: Object,
): any {
  try {
    return checkReturnTypeInner(schema, logging, type, value, subQuery, context, result);
  } catch (ex) {
    if (ex !== error) throw ex;
    const expected = typeString(type);
    const actual = typeNameFromValue(value);
    // N.B. never reveal the actual **value** of the result in here
    throw createError(
      `Expected result to be of type "${expected}" but got a value of type "${actual}"`,
      {exposeProd: true, code: 'INVALID_RETURN_TYPE', data: {expected, actual}},
    );
  }
}
export function validateMutationReturnType(
  schema: Schema,
  logging: Logging,
  type: TypeDefinition,
  value: any,
): any {
  return validateReturnType(schema, logging, type, value, undefined, BICYCLE_MUTATION_CONTEXT, {});
}
