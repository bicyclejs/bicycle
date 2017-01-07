// @flow

import type {Schema, TypeDefinition} from '../flow-types';
import {inspect} from 'util';
import typeString from '../utils/type-name-from-definition';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';

const error = new TypeError('Unexpected type');

function checkArgTypeInner(schema: Schema, type: TypeDefinition, value: any, argName: string): any {
  switch (type.kind) {
    case 'NotNull':
      if (value === null) {
        throw error;
      }
      const result = checkArgTypeInner(schema, type.type, value, argName);
      if (result === null) {
        throw error;
      }
      return result;
    case 'List':
      const subType = type.type;
      if (value == null) return null;
      if (!Array.isArray(value)) {
        throw error;
      }
      return value.map((v, i) => checkArgTypeInner(schema, subType, v, argName));
    case 'NamedTypeReference':
      if (value == null) {
        return null;
      }
      const namedType = schema[type.value];
      if (!namedType) {
        throw error;
      }
      switch (namedType.kind) {
        case 'ScalarType':
          let result;
          try {
            result = namedType.parse(value);
          } catch (ex) {
            throw error;
          }
          if (result === undefined) return null;
          return result;
        default:
          throw new TypeError(`Unrecognised named type kind in arg "${argName}": ${namedType.kind}`);
      }
    default:
      throw new TypeError(`Unrecognised arg type kind in arg "${argName}": ${type.kind}`);
  }
}

export default function validateArg(schema: Schema, type: TypeDefinition, value: any, argName: string): any {
  try {
    return checkArgTypeInner(schema, type, value, argName);
  } catch (ex) {
    if (ex !== error) throw ex;
    const expected = typeString(type);
    const valString = inspect(value, {depth: 10});
    const actual = valString.length < 30 ? valString : 'a "' + typeNameFromValue(value) + '"';
    throw createError(
      `Expected arg "${argName}" to be of type "${expected}" but got ${actual}`,
      {exposeProd: true, code: 'INVALID_ARGUMENT_TYPE', data: {argName, value, expected}},
    );
  }
}
