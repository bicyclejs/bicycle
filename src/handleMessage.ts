import mergeQueries from './utils/merge-queries';
import diffCache from './utils/diff-cache';
import getSessionID from './utils/get-session-id';
import {runQuery, runMutation} from './runner';

import {CacheUpdate} from './types/Cache';
import SessionStore from './sessions/SessionStore';
import ClientRequest from './types/ClientRequest';
import IContext from './types/IContext';
import Logging from './types/Logging';
import Query, {QueryUpdate} from './types/Query';
import Schema from './types/Schema';
import SessionID from './types/SessionID';
import ServerResponse, {
  createExpiredResponse,
  createNewSessionResponse,
  createUpdateResponse,
} from './types/ServerResponse';
import MutationResult from './types/MutationResult';

function thenDispose<T>(promise: Promise<T>, context: IContext): Promise<T> {
  promise.then(
    () => {
      context.dispose && context.dispose();
    },
    () => {
      context.dispose && context.dispose();
    },
  );
  return promise;
}
export default function handleMessage<Context extends IContext>(
  schema: Schema<Context>,
  logging: Logging,
  sessionStore: SessionStore,
  message: ClientRequest,
  context: () => Context,
  mutationContext?: () => Context,
): Promise<ServerResponse> {
  const sessionID = message.s;
  const queryUpdate = message.q;
  const mutations = message.m
    ? message.m.map(m => ({method: m.m, args: m.a}))
    : [];
  return Promise.resolve(null)
    .then(() => {
      const ctx = mutationContext || context;
      return ctx();
    })
    .then(mutationContext => {
      return Promise.all([
        getQuery(sessionID, sessionStore, queryUpdate),
        thenDispose(
          runMutations(schema, logging, mutations, mutationContext),
          mutationContext,
        ),
      ]);
    })
    .then<ServerResponse>(([getQueryResult, mutationResults]) => {
      if (getQueryResult.isExpired) {
        return createExpiredResponse(mutationResults);
      } else {
        const {sessionID, query} = getQueryResult;
        return Promise.resolve(null)
          .then(() => context())
          .then<ServerResponse>(queryContext => {
            if (message.s) {
              return thenDispose(
                runAndDiffQuery(
                  schema,
                  logging,
                  sessionID,
                  sessionStore,
                  query,
                  queryContext,
                ),
                queryContext,
              ).then(data => {
                return createUpdateResponse(data || undefined, mutationResults);
              });
            }
            return thenDispose(
              runQuery(query, {schema, logging, context: queryContext}),
              queryContext,
            ).then(data => {
              return sessionStore
                .setCache(sessionID, data)
                .then(() =>
                  createNewSessionResponse(sessionID, data, mutationResults),
                );
            });
          });
      }
    });
}

export type GetQueryResult =
  | {isExpired: true}
  | {isExpired: false; sessionID: SessionID; query: Query};
export function getQuery(
  nulllableSessionID: SessionID | void,
  sessionStore: SessionStore,
  queryUpdate: QueryUpdate | void,
): Promise<GetQueryResult> {
  if (!nulllableSessionID) {
    return getSessionID(sessionStore).then<GetQueryResult>(sessionID => {
      if (queryUpdate == null) {
        throw new Error(
          'You must provide a queryUpdate if you are not providing a sessionID',
        );
      }
      // If no sessionID is provided, the query update should be a full query
      // TODO: can this be enforced by types
      const notNullQuery = queryUpdate as Query;
      return Promise.all([
        sessionStore.setQuery(sessionID, notNullQuery),
        sessionStore.setCache(sessionID, {}),
      ]).then<GetQueryResult>(() => ({
        sessionID,
        query: notNullQuery,
        isExpired: false,
      }));
    });
  } else {
    const sessionID = nulllableSessionID;
    return Promise.resolve(sessionStore.getQuery(sessionID)).then<
      GetQueryResult
    >(nullableQuery => {
      if (nullableQuery == null) {
        console.warn('session expired');
        return {isExpired: true};
      }
      let query = nullableQuery;
      if (queryUpdate) {
        query = mergeQueries(query, queryUpdate);
        return sessionStore
          .setQuery(sessionID, query)
          .then<GetQueryResult>(() => ({sessionID, query, isExpired: false}));
      }
      return {sessionID, query, isExpired: false};
    });
  }
}

export function runMutations<Context extends IContext>(
  schema: Schema<Context>,
  logging: Logging,
  mutations: Array<{method: string; args: any}>,
  context: Context,
): Promise<MutationResult<any>[]> {
  return new Promise((resolve, reject) => {
    const results: MutationResult<any>[] = [];
    function nextMutation(i: number) {
      if (i >= mutations.length) return resolve(results);
      runMutation(mutations[i], {schema, logging, context}).then(result => {
        results.push(result);
        nextMutation(i + 1);
      }, reject);
    }
    nextMutation(0);
  });
}

export function runAndDiffQuery<Context>(
  schema: Schema<Context>,
  logging: Logging,
  sessionID: SessionID,
  sessionStore: SessionStore,
  query: Query,
  context: Context,
): Promise<CacheUpdate | void> {
  return Promise.all([
    runQuery(query, {schema, logging, context}),
    sessionStore.getCache(sessionID),
  ]).then<CacheUpdate | void>(([data, cache]) => {
    const result = cache ? diffCache(cache, data) : data;
    if (result) {
      return sessionStore.setCache(sessionID, data).then(() => result);
    }
    return result;
  });
}
