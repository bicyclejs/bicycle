import {Request, RequestHandler} from 'express';
import runQueryAgainstCache from './utils/run-query-against-cache';
import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {
  runQuery as runQueryToGetCache,
  runMutation as tryRunMutation,
} from './runner';
import handleMessageInternal from './handleMessage';
import createBicycleMiddlewareInner from './middleware';
import createServerRendererInner, {FakeClient} from './server-rendering';
import MemoryStore from './sessions/MemorySessionStore';
import SessionStore from './sessions/SessionStore';

import ClientRequest from './types/ClientRequest';
import IContext from './types/IContext';
import Logging from './types/Logging';
import MutationResult from './types/MutationResult';
import Query from './types/Query';
import Schema from './types/Schema';
import ServerPreparation from './types/ServerPreparation';
import ServerResponse from './types/ServerResponse';

export interface Options {
  readonly disableDefaultLogging?: boolean;
  readonly sessionStore?: SessionStore;
  readonly onError?: (e: {error: Error}) => any;
  readonly onMutationStart?: (
    e: {mutation: {readonly method: string; readonly args: Object}},
  ) => any;
  readonly onMutationEnd?: (
    e: {
      mutation: {readonly method: string; readonly args: Object};
      result: MutationResult<any>;
    },
  ) => any;
  readonly onQueryStart?: (e: {query: Object}) => any;
  readonly onQueryEnd?: (e: {query: Object; cacheResult: Object}) => any;
}
function noop() {
  return null;
}
export default class BicycleServer<Context extends IContext> {
  _logging: Logging;
  _schema: Schema<Context>;
  _sessionStore: SessionStore;

  constructor(
    schema: {objects: any[]; scalars?: any[]} | string,
    options: Options = {},
  ) {
    this._schema =
      typeof schema === 'string'
        ? loadSchemaFromFiles(schema)
        : loadSchema(schema);
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
    return runQueryToGetCache(query, {
      schema: this._schema,
      logging: this._logging,
      context: context,
    }).then(cache => {
      const {loaded, result, errors} = runQueryAgainstCache(cache, query);
      if (errors.length) {
        throw new Error(errors[0]);
      }
      if (!loaded) {
        throw new Error(
          'Bicycle data failed to load, this should never happen.',
        );
      }
      return result;
    });
  }

  runMutation(method: string, args: any, context: Context): any {
    return tryRunMutation(
      {method, args},
      {
        schema: this._schema,
        logging: this._logging,
        context,
      },
    ).then(({s, v}) => {
      if (s) {
        return v;
      } else {
        const err = new Error(v.message);
        err.data = v.data;
        err.code = v.code;
        throw err;
      }
    });
  }

  handleMessage(
    message: ClientRequest,
    getContext: (
      options: {
        stage: 'query' | 'mutation';
      },
    ) => Context,
  ): Promise<ServerResponse> {
    return handleMessageInternal(
      this._schema,
      this._logging,
      this._sessionStore,
      message,
      () => getContext({stage: 'query'}),
      () => getContext({stage: 'mutation'}),
    );
  }

  createMiddleware(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
  ): RequestHandler {
    return createBicycleMiddlewareInner(
      this._schema,
      this._logging,
      this._sessionStore,
      getContext,
    );
  }

  createServerRenderer<TResult>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (client: FakeClient, req: Request) => TResult,
  ): (
    req: Request,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (client: FakeClient, req: Request, a1: TArg1) => TResult,
  ): (
    req: Request,
    a1: TArg1,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (client: FakeClient, req: Request, a1: TArg1, a2: TArg2) => TResult,
  ): (
    req: Request,
    a1: TArg1,
    a2: TArg2,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2, TArg3>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (
      client: FakeClient,
      req: Request,
      a1: TArg1,
      a2: TArg2,
      a3: TArg3,
    ) => TResult,
  ): (
    req: Request,
    a1: TArg1,
    a2: TArg2,
    a3: TArg3,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2, TArg3, TArg4>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (
      client: FakeClient,
      req: Request,
      a1: TArg1,
      a2: TArg2,
      a3: TArg3,
      a4: TArg4,
    ) => TResult,
  ): (
    req: Request,
    a1: TArg1,
    a2: TArg2,
    a3: TArg3,
    a4: TArg4,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult>(
    getContext: (
      req: Request,
      options: {stage: 'query' | 'mutation'},
    ) => Context,
    fn: (client: FakeClient, req: Request, ...args: any[]) => TResult,
  ): (
    req: Request,
    ...args: any[]
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}> {
    return createServerRendererInner(
      this._schema,
      this._logging,
      this._sessionStore,
      getContext,
      fn,
    );
  }
}
