// @flow

import type {ArgType, Schema} from '../flow-types';
import suggestMatch from '../utils/suggest-match';
import createError from '../utils/create-error';
import validateArg from './arg-validator';

export default function validateArgs(
  schema: Schema,
  type: {[key: string]: ArgType},
  inputObject: Object,
): Object {
  Object.keys(inputObject).forEach(key => {
    if (!(key in type)) {
      const suggestion = suggestMatch(Object.keys(type), key);
      throw createError(
        `Unexpected argument "${key}"${suggestion}`,
        {exposeProd: true, code: 'UNEXPECTED_ARG', data: {argName: key}},
      );
    }
  });

  const typedResult = {};
  Object.keys(type).map(key => {
    typedResult[key] = validateArg(
      schema,
      type[key].type,
      inputObject[key],
      key,
    );
  });
  return typedResult;
}
