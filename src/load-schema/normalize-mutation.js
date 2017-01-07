// @flow

import type {MutationType} from '../flow-types';
import assert from 'assert';
import suggestMatch from '../utils/suggest-match';
import getTypeName from '../utils/type-name-from-value';
import normalizeArgs from './normalize-args';
import getType from './get-type';

const VALID_KEYS = ['type', 'description', 'args', 'resolve'];

function normalizeMutation(
  mutation: Object,
  typeName: string,
  mutationName: string,
  typeNames: Array<string>,
): MutationType {
  Object.keys(mutation).forEach(key => {
    if (VALID_KEYS.indexOf(key) === -1) {
      const suggestion = suggestMatch(VALID_KEYS, key);
      throw new Error(
        `Invalid key "${key}" in ${typeName}.${mutationName}${suggestion}`
      );
    }
  });
  assert(
    mutation.description === undefined || typeof mutation.description === 'string',
    `Expected ${typeName}.${mutationName}.description to be a string but got ${getTypeName(mutation.description)}`,
  );
  assert(
    typeof mutation.resolve === 'function',
    `Expected ${typeName}.${mutationName} to have a resolve function`,
  );
  const type = mutation.type ? getType(mutation.type, typeName + '.' + mutationName, typeNames) : undefined;
  const args = mutation.args ? normalizeArgs(mutation.args, typeName, mutationName, typeNames) : undefined;
  return {
    type,
    description: mutation.description,
    args,
    resolve: mutation.resolve,
  };
}

export default normalizeMutation;
