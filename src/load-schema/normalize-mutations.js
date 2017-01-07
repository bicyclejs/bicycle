// @flow

import type {MutationsType} from '../flow-types';
import assert from 'assert';
import freeze from '../utils/freeze';
import getTypeName from '../utils/type-name-from-value';
import normalizeMutation from './normalize-mutation';

function normalizeMutations(mutations: Object, typeName: string, typeNames: Array<string>): MutationsType {
  const result = {
    set: mutations.set,
  };
  if (mutations.set !== undefined && typeof mutations.set !== 'function') {
    throw new Error(
      'The `set` mutation is a special case, it automatically takes `id`, `field` and `value`. ' +
      'You don\'t need to specify argument types for it so you should just use a function as shorthand. ' +
      `Look in ${typeName}.mutations.set to fix this.`
    );
  }
  Object.keys(mutations).forEach(mutationName => {
    if (mutationName === 'set') {
      return;
    }
    const mutation = mutations[mutationName];
    if (mutation === undefined) {
      return;
    }
    assert(
      /^[A-Za-z]+$/.test(mutationName),
      `Expected ${typeName}'s mutation names to match [A-Za-z0-9]+ but got '${mutationName}'`,
    );
    assert(
      typeof mutation === 'object',
      `Expected ${typeName}.${mutationName} to be an object but got ${getTypeName(mutation)}`
    );
    result[mutationName] = normalizeMutation(
      mutation,
      typeName,
      mutationName,
      typeNames,
    );
  });
  return freeze(result);
}

export default normalizeMutations;
