// @flow

import type {Logging, Schema, ServerPreparation, SessionID, SessionStore, Query, Context} from './flow-types';

import Promise from 'promise';
import notEqual from './utils/not-equal';
import mergeQueries from './utils/merge-queries';
import runQueryAgainstCache from './utils/run-query-against-cache';
import getSessionID from './utils/get-session-id';
import {runQuery} from './runner';
import {serverPreparation as createServerPreparation} from './messages';

export class FakeClient {
  _sessionID: SessionID;
  _query: Query;
  _cache: Object;
  constructor(sessionID: SessionID) {
    this._sessionID = sessionID;
    this._query = {};
    this._cache = {root: {}};
  }
  _serverPreparation(): ServerPreparation {
    return createServerPreparation(
      this._sessionID,
      this._query,
      this._cache,
    );
  }
  queryCache(query: Query): {result: Object, loaded: boolean, errors: Array<string>} {
    this._query = mergeQueries(this._query, query);
    return runQueryAgainstCache(this._cache, this._cache['root'], query);
  }
  update() {
    throw new Error('Bicycle server renderer does not implement update');
  }
  subscribe() {
    throw new Error('Bicycle server renderer does not implement subscribe');
  }
}

// declare this so that flow-runtime ignores TResult
type TResult = mixed;

export default function prepare<TResult>(
  schema: Schema,
  logging: Logging,
  sessionStore: SessionStore,
  fn: (client: FakeClient, ...args: any) => TResult,
): Function /* (context: Context, ...args: any) => Promise<{serverPreparation: ServerPreparation, result: TResult}> */ {
  return (context: Context, ...args: any) => {
    return getSessionID(sessionStore).then(sessionID => {
      const client = new FakeClient(sessionID);
      return new Promise((resolve, reject) => {
        function next() {
          try {
            const oldServerPreparation = client._serverPreparation();
            const result = fn(client, ...args);
            const newServerPreparation = client._serverPreparation();
            if (!notEqual(oldServerPreparation.q, newServerPreparation.q)) {
              return resolve({serverPreparation: newServerPreparation, result});
            }
            runQuery(
              schema,
              logging,
              newServerPreparation.q,
              context
            ).done(data => {
              if (notEqual(newServerPreparation.c, data)) {
                client._cache = data;
                return next();
              } else {
                return resolve({serverPreparation: newServerPreparation, result});
              }
            }, reject);
          } catch (ex) {
            reject(ex);
          }
        }
        next();
      });
    }).then(result => {
      return Promise.all([
        sessionStore.setCache(result.serverPreparation.s, result.serverPreparation.c),
        sessionStore.setQuery(result.serverPreparation.s, result.serverPreparation.q),
      ]).then(() => result);
    });
  };
}
