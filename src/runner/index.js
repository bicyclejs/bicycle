import Promise from 'promise';
import validateArg from './arg-validator';
import validateArgs from './args-validator';
import suggestMatch from '../utils/suggest-match';
import typeNameFromValue from '../utils/type-name-from-value';
import {reportError} from '../error-reporting';

import runQueryInternal from './run-query';

export function runQuery(schema: Object, query: Object, context: Object): Promise<Object> {
  const result = {};
  return runQueryInternal(schema, schema.Root, context, query, context, result).then(() => result);
}

export function runMutation(schema: Object, mutation: {method: string, args: Object}, context: Object): Promise {
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
      const err = new TypeError('The type ' + type + ' does not define a mutation ' + name + suggestion);
      err.exposeProd = true;
      throw err;
    }

    if (name === 'set') {
      if (typeof args.id !== 'number' && typeof args.id !== 'string') {
        const err = new TypeError(
          `Expected arg "id" to be of type "number" or "string" but got ${typeNameFromValue(args.id)}`
        );
        err.exposeProd = true;
        throw err;
      }
      if (typeof args.field !== 'string') {
        const err = new TypeError(
          `Expected arg "field" to be of type "string" but got ${typeNameFromValue(args.field)}`
        );
        err.exposeProd = true;
        throw err;
      }
      if (!(args.field in Type.fields)) {
        const suggestion = suggestMatch(Object.keys(Type.fields), args.field);
        const err = new Error(
          `Field "${args.field}" does not exist on type "${Type.name}"${suggestion}`
        );
        err.exposeProd = true;
        throw err;
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
    if (method.type) {
      return {s: true, v: validateArgs(schema, method.type, value)};
    } else {
      return true;
    }
  }).then(null, err => {
    const result = (
      process.env.NODE_ENV === 'production' && !err.exposeProd
      ? {
        message: (
          'An unexpected error was encountered when running ' + mutation.method +
          ' (if you are the developer of this app, you can set "NODE_ENV" to "development" to expose the full error)'
        ),
        data: {},
        code: 'PRODUCTION_ERROR',
      }
      : {
        message: err.message + ' while running ' + mutation.method,
        data: err.data || {},
        code: err.code,
      }
    );
    err.message += ' while running ' + mutation.method;
    reportError(err);
    return {s: false, v: result};
  });
}
