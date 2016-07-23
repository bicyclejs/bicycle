// @public

import runQueryAgainstCache from './utils/run-query-against-cache';
import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {runQuery as runQueryToGetCache, runMutation as tryRunMutation} from './runner';
import handleMessage from './message-handler';
import createBicycleMiddleware from './middleware';
import createServerRenderer from './server-rendering';

function runQuery(schema, query) {
  return runQueryToGetCache(schema, query).then(cache => {
    const {loaded, result, errors} = runQueryAgainstCache(cache, cache.root, query);
    if (errors.length) {
      throw new Error(errors[0]);
    }
    if (!loaded) {
      throw new Error('Bicycle data failed to load, this should never happen.');
    }
    return result;
  });
}
function runMutation(schema, method, args, context) {
  return tryRunMutation(schema, {method, args}, context).then(
    ({s, v}) => {
      if (s) {
        return v;
      } else {
        const err = new Error(v.message);
        err.data = v.data;
        err.code = v.code;
        throw err;
      }
    },
  );
}
export {
  // (s: {objects: [], scalars: []}) => Schema
  loadSchema,
  // (dirname: string) => Schema
  loadSchemaFromFiles,
  // (schema: Schema, query: Object, context: Object) => Promise<Object>
  runQuery,
  // (schema: Schema, method: string, args: Object, context: Object) => Promise<Result>
  runMutation,
  // (schema: Object, sessionStore: SessionStore, message: Message, context: Object) => Promise<Result>
  handleMessage,
  // (schema: Schema, sessionStore: SessionStore, getContext: (req) => Object) => Middleware
  createBicycleMiddleware,
  // (schema: Schema, sessionStore: SessionStore, fn: (client: Object, ...args) => Result) => (context: Object, ...args) => Result
  createServerRenderer,
};
