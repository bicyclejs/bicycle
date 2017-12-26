import {Request, Response, RequestHandler} from 'express';
import runQueryAgainstCache from './utils/run-query-against-cache';
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
import Logging from './types/Logging';
import MutationResult from './types/MutationResult';
import Query from './types/Query';
import Schema from './types/Schema';
import ServerPreparation from './types/ServerPreparation';
import ServerResponse from './types/ServerResponse';

import {BaseRootQuery, Mutation} from './typed-helpers/query';

import withContext, {Ctx} from './Ctx';

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
export default class BicycleServer<Context> {
  _logging: Logging;
  _schema: Schema<Context>;
  _sessionStore: SessionStore;

  constructor(schema: Schema<Context>, options: Options = {}) {
    this._schema = schema;
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

  runQuery<TResult>(
    query: BaseRootQuery<TResult>,
    context: Ctx<Context>,
  ): Promise<TResult>;
  runQuery(query: Query, context: Ctx<Context>): Promise<any>;
  runQuery<TResult>(
    query: Query | BaseRootQuery<TResult>,
    context: Ctx<Context>,
  ): Promise<any> {
    const q: Query = query instanceof BaseRootQuery ? query._query : query;
    return withContext(context, context =>
      runQueryToGetCache(q, {
        schema: this._schema,
        logging: this._logging,
        context: context,
      }),
    ).then(cache => {
      const {loaded, result, errors} = runQueryAgainstCache(cache, q);
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
  runMutation<TResult>(
    mutation: Mutation<TResult>,
    context: Ctx<Context>,
  ): Promise<TResult>;
  runMutation(method: string, args: any, context: Ctx<Context>): Promise<any>;
  runMutation<TResult>(
    method: string | Mutation<TResult>,
    args: any,
    context?: Ctx<Context>,
  ): Promise<any> {
    const m: string = method instanceof Mutation ? method._name : method;
    const a: any = method instanceof Mutation ? method._args : args;
    const c: Ctx<Context> = method instanceof Mutation ? args : context;
    return withContext(c, c =>
      tryRunMutation(
        {method: m, args: a},
        {
          schema: this._schema,
          logging: this._logging,
          context: c,
        },
      ),
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
    ) => Ctx<Context>,
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
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
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
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (client: FakeClient, req: Request, res: Response) => TResult,
  ): (
    req: Request,
    res: Response,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1>(
    getContext: (
      req: Request,
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (client: FakeClient, req: Request, a1: TArg1) => TResult,
  ): (
    req: Request,
    a1: TArg1,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2>(
    getContext: (
      req: Request,
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (
      client: FakeClient,
      req: Request,
      res: Response,
      a1: TArg1,
      a2: TArg2,
    ) => TResult,
  ): (
    req: Request,
    res: Response,
    a1: TArg1,
    a2: TArg2,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2, TArg3>(
    getContext: (
      req: Request,
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (
      client: FakeClient,
      req: Request,
      res: Response,
      a1: TArg1,
      a2: TArg2,
      a3: TArg3,
    ) => TResult,
  ): (
    req: Request,
    res: Response,
    a1: TArg1,
    a2: TArg2,
    a3: TArg3,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult, TArg1, TArg2, TArg3, TArg4>(
    getContext: (
      req: Request,
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (
      client: FakeClient,
      req: Request,
      res: Response,
      a1: TArg1,
      a2: TArg2,
      a3: TArg3,
      a4: TArg4,
    ) => TResult,
  ): (
    req: Request,
    res: Response,
    a1: TArg1,
    a2: TArg2,
    a3: TArg3,
    a4: TArg4,
  ) => Promise<{serverPreparation: ServerPreparation; result: TResult}>;
  createServerRenderer<TResult>(
    getContext: (
      req: Request,
      res: Response,
      options: {stage: 'query' | 'mutation'},
    ) => Ctx<Context>,
    fn: (
      client: FakeClient,
      req: Request,
      res: Response,
      ...args: any[]
    ) => TResult,
  ): (
    req: Request,
    res: Response,
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
