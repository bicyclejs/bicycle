// @flow

import type {Context, MutationType, MutationResult, ObjectType, Query, Schema} from '../flow-types';
import Promise from 'promise';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';
import freeze from '../utils/freeze';
import validateArg from './arg-validator';
import validateArgs from './args-validator';
import {validateMutationReturnType} from './validate-return-type';

const EMPTY_OBJECT = freeze({});
export default function runMutation(
  schema: Schema,
  mutation: {method: string, args: Object},
  typeName: string,
  mutationName: string,
  Type: ObjectType,
  method: MutationType,
  context: Context,
): Promise<MutationResult> {
  const args = mutation.args;
  return Promise.resolve(null).then(() => {
    const typedArgs = freeze(
      method.args
      ? validateArgs(schema, method.args, args)
      : EMPTY_OBJECT
    );
    return method.resolve(typedArgs, context, {type: typeName, name: mutationName});
  }).then(value => {
    if (method && method.type) {
      return Promise.resolve(
        validateMutationReturnType(schema, method.type, value),
      ).then(value => {
        return {s: true, v: value};
      });
    } else {
      return true;
    }
  });
}
