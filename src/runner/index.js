import Promise from 'promise';
import validateArg from './arg-validator';
import validateArgs from './args-validator';
import suggestMatch from '../utils/suggest-match';
import typeNameFromValue from '../utils/type-name-from-value';

import runQueryInternal from './run-query';

export function runQuery(schema: Object, query: Object, context: Object): Promise<Object> {
  const result = {};
  return runQueryInternal(schema, schema.Root, context, query, context, result).then(() => result);
}

export function runMutation(schema: Object, mutation: {method: string, args: Object}, context: any): Promise {
  let method;
  return Promise.resolve(null).then(() => {
    const [type, name] = mutation.method.split('.');
    const args = mutation.args;
    const Type = schema[type];
    if (!Type) throw new TypeError('Unrecognised type for mutation: ' + type);
    if (!Type.mutations) throw new TypeError('The type ' + type + ' does not define any mutations.');
    method = Type.mutations[name];
    if (!method) {
      const suggestion = suggestMatch(Object.keys(Type.mutations), name);
      throw new TypeError('The type ' + type + ' does not define a mutation ' + name + suggestion);
    }

    if (name === 'set') {
      if (typeof args.id !== 'number' && typeof args.id !== 'string') {
        throw new TypeError(
          `Expected arg "id" to be of type "number" or "string" but got ${typeNameFromValue(args.id)}`
        );
      }
      if (typeof args.field !== 'string') {
        throw new TypeError(
          `Expected arg "field" to be of type "string" but got ${typeNameFromValue(args.field)}`
        );
      }
      if (!(args.field in Type.fields)) {
        const suggestion = suggestMatch(Object.keys(Type.fields), args.field);
        throw new Error(
          `Field "${args.field}" does not exist on type "${Type.name}"${suggestion}`
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
      return method(typedArgs, context, {type, name});
    } else {
      const typedArgs = validateArgs(
        schema,
        method.args,
        args,
      );
      return method.resolve(typedArgs, context, {type, name});
    }
  }).then(value => {
    // TODO: support return types here
    if (method.type) {
      return {success: true, value: validateArgs(schema, method.type, value)};
    } else {
      return {success: true, value: null};
    }
  }).then(null, err => {
    console.error(err.stack);
    return {success: false, value: err.message + ' while running ' + mutation.method};
  });
}
