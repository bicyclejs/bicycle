import cuid = require('cuid');
import {Request, Response} from 'express';
import notEqual from './utils/not-equal';
import mergeQueries from './utils/merge-queries';
import runQueryAgainstCache, {
  QueryCacheResult,
} from './utils/run-query-against-cache';
import getSessionID from './utils/get-session-id';
import {runQuery} from './runner';

import SessionStore from './sessions/SessionStore';
import Cache from './types/Cache';
import Logging from './types/Logging';
import Query from './types/Query';
import Schema from './types/Schema';
import SessionID from './types/SessionID';
import ServerPreparation, {
  createServerPreparation,
} from './types/ServerPreparation';

import {BaseRootQuery} from './typed-helpers/query';
import withContext, {Ctx} from './Ctx';
import SessionVersion from './types/SessionVersion';

export class FakeClient {
  _sessionID: SessionID;
  _query: Query;
  _cache: Cache;
  constructor(sessionID: SessionID) {
    this._sessionID = sessionID;
    this._query = {};
    this._cache = {Root: {root: {}}};
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
    ]).then(([sessionID, context]) => {
      const client = new FakeClient(sessionID);
      return withContext(context, context => {
        const queryContext = {schema, logging, context};
        return new Promise<TResult>((resolve, reject) => {
          function next() {
            try {
              const oldQuery = client._query;
              const oldCache = client._cache;
              const result = fn(client, req, res, ...args);
              const newQuery = client._query;
              if (!notEqual(oldQuery, newQuery)) {
                return resolve(result);
              }
              runQuery(newQuery, queryContext).then(
                data => {
                  if (notEqual(oldCache, data)) {
                    client._cache = data;
                    return next();
                  } else {
                    return resolve(result);
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
        }).then(result => {
          return sessionStore
            .tx(sessionID, () => {
              const version = SessionVersion.unsafeCast(cuid());
              return Promise.resolve({
                session: {
                  versions: [
                    {version, query: client._query, cache: client._cache},
                  ],
                  mutations: {},
                },
                result: version,
              });
            })
            .then(version => ({
              result,
              serverPreparation: createServerPreparation(
                sessionID,
                version,
                client._query,
                client._cache,
              ),
            }));
        });
      });
    });
  };
}
