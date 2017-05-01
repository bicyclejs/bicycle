// @public
// @flow

import type Promise from 'promise';
import type {ClientRequest, ErrorInterface, Logging, MutationResult, Schema, ServerResponse, SessionStore, Query, Context} from './flow-types';
import type {FakeClient} from './server-rendering';
import runQueryAgainstCache from './utils/run-query-against-cache';
import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {runQuery as runQueryToGetCache, runMutation as tryRunMutation} from './runner';
import handleMessageInternal from './message-handler';
import createBicycleMiddlewareInner from './middleware';
import createServerRendererInner from './server-rendering';
import MemoryStore from './sessions/memory';

type Options = {
  +disableDefaultLogging?: boolean,
  +sessionStore?: SessionStore,
  +onError?: ({error: ErrorInterface}) => mixed,
  +onMutationStart?: ({mutation: {+method: string, +args: Object}}) => mixed,
  +onMutationEnd?: ({mutation: {+method: string, +args: Object}, result: MutationResult}) => mixed,
  +onQueryStart?: ({query: Object}) => mixed,
  +onQueryEnd?: ({query: Object, cacheResult: Object}) => mixed,
};
function noop() {
  return null;
}
export default class BicycleServer {
  _logging: Logging;
  _schema: Schema;
  _sessionStore: SessionStore;

  constructor(schema: Object | string, options: Options = {}) {
    this._schema = (
      typeof schema === 'string'
      ? loadSchemaFromFiles(schema)
      : loadSchema(schema)
    );
    this._sessionStore = options.sessionStore || new MemoryStore();
    this._logging = {
      disableDefaultLogging: options.disableDefaultLogging || false,
      onError: options.onError || noop,
      onMutationStart: options.onMutationStart || noop,
      onMutationEnd: options.onMutationEnd || noop,
      onQueryStart: options.onQueryStart || noop,
      onQueryEnd: options.onQueryEnd || noop,
    };
  }

  runQuery(query: Query, context: Context): Promise<Object> {
    return runQueryToGetCache(this._schema, this._logging, query, context).then(cache => {
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

  runMutation(method: string, args: Object, context: Context): any {
    return tryRunMutation(this._schema, this._logging, {method, args}, context).then(
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

  handleMessage(
    message: ClientRequest,
    context: Context,
    mutationContext?: Context,
  ): Promise<ServerResponse> {
    return handleMessageInternal(
      this._schema,
      this._logging,
      this._sessionStore,
      message,
      context,
      mutationContext,
    );
  }

  createMiddleware(
    getContext: (req: Object, options: {stage: 'query' | 'mutation'}) => Context,
  ) {
    return createBicycleMiddlewareInner(this._schema, this._logging, this._sessionStore, getContext);
  }

  createServerRenderer<TResult>(
    fn: (client: FakeClient, ...args: any) => TResult,
  ): Function /* (context: Context, ...args: any) => Promise<{serverPreparation: ServerPreparation, result: TResult}> */ {
    return createServerRendererInner(this._schema, this._logging, this._sessionStore, fn);
  }
}
