// @public
// @flow

import type {Schema, Query, Context} from './flow-types';
import runQueryAgainstCache from './utils/run-query-against-cache';
import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {runQuery as runQueryToGetCache, runMutation as tryRunMutation} from './runner';
import handleMessage from './message-handler';
import createBicycleMiddleware from './middleware';
import createServerRenderer from './server-rendering';
import {
  onError as onBicycleError,
  silenceDefaultErrorReporting as silenceDefaultBicycleErrorReporting,
} from './error-reporting';

function runQuery(schema: Schema, query: Query, context: Context) {
  return runQueryToGetCache(schema, query, context).then(cache => {
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
function runMutation(schema: Schema, method: string, args: Object, context: Context) {
  return tryRunMutation(schema, {method, args}, context).then(
    (result) => {
      if (result === true) {
        return;
      }
      const {s, v} = result;
      if (s) {
        return v;
      } else {
        const err = new Error(v.message);
        // $FlowFixMe: errors are not extensible
        err.data = v.data;
        // $FlowFixMe: errors are not extensible
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
  // (schema: Schema, query: Query, context: Context) => Promise<Object>
  runQuery,
  // (schema: Schema, method: string, args: Object, context: Object) => Promise<Result>
  runMutation,
  // (schema: Object, sessionStore: SessionStore, message: Message, context: Object) => Promise<Result>
  handleMessage,
  // (schema: Schema, sessionStore: SessionStore, getContext: (req) => Object) => Middleware
  createBicycleMiddleware,
  // (schema: Schema, sessionStore: SessionStore, fn: (client: Object, ...args) => Result) => (context: Object, ...args) => Result
  createServerRenderer,

  onBicycleError,
  silenceDefaultBicycleErrorReporting,
};
