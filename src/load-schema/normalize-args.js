// @flow

import type {ArgType} from '../flow-types';
import getType from './get-type';

function normalizeArgs(
  input: Object,
  typeName: string,
  fieldName: string,
  typeNames: Array<string>,
): {[key: string]: ArgType} {
  const result = {};
  Object.keys(input).forEach(argName => {
    result[argName] = {
      kind: 'arg',
      type: getType(input[argName], typeName + '.' + fieldName + '.' + argName, typeNames),
    };
  });
  return result;
}

export default normalizeArgs;
