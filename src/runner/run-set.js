// @flow

import type {Context, SetMutation, ObjectType, Query, Schema} from '../flow-types';
import Promise from 'promise';
import suggestMatch from '../utils/suggest-match';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';
import validateArg from './arg-validator';
import validateArgs from './args-validator';
import {validateMutationReturnType} from './validate-return-type';

export default function runMutation(
  schema: Schema,
  mutation: {method: string, args: Object},
  typeName: string,
  mutationName: string,
  Type: ObjectType,
  method: SetMutation,
  context: Context,
): Promise<true> {
  const args = mutation.args;
  return Promise.resolve(null).then(() => {
    if (typeof args.id !== 'number' && typeof args.id !== 'string') {
      throw createError(
        `Expected arg "id" to be of type "number of "string but got ${typeNameFromValue(args.id)}`,
        {
          exposeProd: true,
          code: 'INVALID_ARGUMENT_TYPE',
          data: {argName: 'id', value: args.id, expected: 'string|number'},
        },
      );
    }
    if (typeof args.field !== 'string') {
      throw createError(
        `Expected arg "field" to be of type "string" but got ${typeNameFromValue(args.field)}`,
        {
          exposeProd: true,
          code: 'INVALID_ARGUMENT_TYPE',
          data: {argName: 'field', value: args.field, expected: 'string'},
        },
      );
    }
    if (!(args.field in Type.fields)) {
      const suggestion = suggestMatch(Object.keys(Type.fields), args.field);
      throw createError(
        `Field "${args.field}" does not exist on type "${Type.name}"${suggestion}`,
        {
          exposeProd: true,
          code: 'INVALID_ARGUMENT_TYPE',
          data: {argName: 'field', value: args.field},
        },
      );
    }
    const typedArgs = {
      id: args.id,
      field: args.field,
      value: validateArg(
        schema,
        Type.fields[args.field].type,
        args.value === undefined ? null : args.value,
        args.field
      ),
    };
    return method(typedArgs, context, {type: typeName, name: mutationName});
  }).then(value => {
    return true;
  });
}
