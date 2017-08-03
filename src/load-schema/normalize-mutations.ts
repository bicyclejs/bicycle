import assert from 'assert';
import normalizeMutation from './normalize-mutation';
import SchemaKind from '../types/SchemaKind';
import {Field, Mutation} from '../types/Schema';
import * as ta from './TypeAssertions';

function normalizeMutations(
  mutations: {},
  typeName: string,
  typeNames: string[],
  fields: {[name: string]: Field<any, any, any, any>},
): {[mutationName: string]: Mutation<any, any, any>} {
  // const result = {
  //   set: mutations.set,
  // };
  // if (mutations.set !== undefined && typeof mutations.set !== 'function') {
  //   throw new Error(
  //     'The `set` mutation is a special case, it automatically takes `id`, `field` and `value`. ' +
  //     'You don\'t need to specify argument types for it so you should just use a function as shorthand. ' +
  //     `Look in ${typeName}.mutations.set to fix this.`
  //   );
  // }
  const result: {[mutationName: string]: Mutation<any, any, any>} = {};
  const m = ta.Void
    .or(ta.AnyObject)
    .validate(mutations, typeName + '.mutations');
  if (m === undefined) {
    return {};
  }
  Object.keys(m).forEach(mutationName => {
    if (mutationName === 'set') {
      return;
    }
    const mutation = m[mutationName];
    if (mutation === undefined) {
      return;
    }
    assert(
      /^[A-Za-z]+$/.test(mutationName),
      `Expected ${typeName}'s mutation names to match [A-Za-z0-9]+ but got '${mutationName}'`,
    );
    if (mutationName === 'set') {
      result.set = {
        kind: SchemaKind.Mutation,
        name: 'set',
        description: 'Set a property on the given ' + typeName,
        argType: {
          kind: SchemaKind.Object,
          properties: {
            id: {
              kind: SchemaKind.Union,
              elements: [{kind: SchemaKind.String}, {kind: SchemaKind.Number}],
            },
            field: {
              kind: SchemaKind.Union,
              elements: Object.keys(fields).map(n => ({
                kind: SchemaKind.Literal,
                value: n,
              })),
            },
          },
        },
        resultType: {kind: SchemaKind.Void},
        auth: 'public',
        resolve(
          args: {id: number | string; field: string; value: any},
          ctx: any,
        ): void {},
      } as Mutation<any, any, any>;
    } else {
      result[mutationName] = normalizeMutation(
        mutation,
        typeName,
        mutationName,
        typeNames,
      );
    }
  });
  return result;
}

export default normalizeMutations;
