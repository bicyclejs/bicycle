import {Request, Response} from 'express';
import notEqual from './utils/not-equal';
import mergeQueries from './utils/merge-queries';
import runQueryAgainstCache, {
  QueryCacheResult,
} from './utils/run-query-against-cache';
import getSessionID from './utils/get-session-id';
import {runQuery} from './runner';
import {serverPreparation as createServerPreparation} from './messages';

import SessionStore from './sessions/SessionStore';
import Cache from './types/Cache';
import Logging from './types/Logging';
import Query from './types/Query';
import Schema from './types/Schema';
import SessionID from './types/SessionID';
import ServerPreparation from './types/ServerPreparation';

import {BaseRootQuery} from './typed-helpers/query';
import withContext, {Ctx} from './Ctx';

export class FakeClient {
  _sessionID: SessionID;
  _query: Query;
  _cache: Cache;
  constructor(sessionID: SessionID) {
    this._sessionID = sessionID;
    this._query = {};
    this._cache = {Root: {root: {}}};
  }
  _serverPreparation(): ServerPreparation {
    return createServerPreparation(this._sessionID, this._query, this._cache);
  }
  queryCache<TResult>(query: BaseRootQuery<TResult>): QueryCacheResult<TResult>;
  queryCache(query: Query): QueryCacheResult<any>;
  queryCache<TResult>(
    query: Query | BaseRootQuery<TResult>,
  ): QueryCacheResult<TResult> {
    const q = query instanceof BaseRootQuery ? query._query : query;
    this._query = mergeQueries(this._query, q);
    return runQueryAgainstCache(this._cache, q);
  }
  update() {
    throw new Error('Bicycle server renderer does not implement update');
  }
  subscribe() {
    throw new Error('Bicycle server renderer does not implement subscribe');
  }
}

export default function prepare<Context, TResult>(
  schema: Schema<Context>,
  logging: Logging,
  sessionStore: SessionStore,
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
  return (req, res, ...args: any[]) => {
    return Promise.all([
      getSessionID(sessionStore),
      getContext(req, res, {stage: 'query'}),
    ])
      .then(([sessionID, context]) => {
        return withContext(context, context => {
          const queryContext = {schema, logging, context};
          const client = new FakeClient(sessionID);
          return new Promise<{
            serverPreparation: ServerPreparation;
            result: TResult;
          }>((resolve, reject) => {
            function next() {
              try {
                const oldServerPreparation = client._serverPreparation();
                const result = fn(client, req, res, ...args);
                const newServerPreparation = client._serverPreparation();
                if (!notEqual(oldServerPreparation.q, newServerPreparation.q)) {
                  return resolve({
                    serverPreparation: newServerPreparation,
                    result,
                  });
                }
                runQuery(newServerPreparation.q, queryContext).then(
                  data => {
                    if (notEqual(newServerPreparation.c, data)) {
                      client._cache = data;
                      return next();
                    } else {
                      return resolve({
                        serverPreparation: newServerPreparation,
                        result,
                      });
                    }
                  },
                  err => {
                    reject(err);
                  },
                );
              } catch (ex) {
                reject(ex);
              }
            }
            next();
          });
        });
      })
      .then(result => {
        return Promise.all([
          sessionStore.setCache(
            result.serverPreparation.s,
            result.serverPreparation.c,
          ),
          sessionStore.setQuery(
            result.serverPreparation.s,
            result.serverPreparation.q,
          ),
        ]).then(() => result);
      });
  };
}
