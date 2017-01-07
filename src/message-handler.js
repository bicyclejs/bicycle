// @flow

import type {ClientRequest, Context, MutationResult, Query, Schema, ServerResponse, SessionID, SessionStore} from './flow-types';

import Promise from 'promise';
import mergeQueries from './utils/merge-queries';
import diffCache from './utils/diff-cache';
import getSessionID from './utils/get-session-id';
import {runQuery, runMutation} from './runner';
import {response as createResponse} from './messages';

export default function handleMessage(
  schema: Schema,
  sessionStore: SessionStore,
  message: ClientRequest,
  context: Context,
  mutationContext?: Context,
): Promise<ServerResponse> {
  const sessionID = message.s;
  const queryUpdate = message.q;
  const mutations = message.m ? message.m.map(m => ({method: m.m, args: m.a})) : [];
  return Promise.all([
    getQuery(sessionID, sessionStore, queryUpdate),
    runMutations(schema, mutations, mutationContext || context),
  ]).then(([getQueryResult, mutationResults]) => {
    if (getQueryResult.isExpired) {
      return createResponse(undefined, mutationResults, undefined);
    } else {
      const {sessionID, query} = getQueryResult;
      return runAndDiffQuery(schema, sessionID, sessionStore, query, context).then(
        data => createResponse(sessionID, mutationResults, data || undefined)
      );
    }
  });
}

export function getQuery(
  nulllableSessionID: ?SessionID,
  sessionStore: SessionStore,
  queryUpdate: ?Object,
): Promise<{isExpired: true} | {isExpired: false, sessionID: SessionID, query: Object}> {
  if (!nulllableSessionID) {
    return getSessionID(sessionStore).then(sessionID => {
      if (queryUpdate == null) {
        throw new Error('You must provide a queryUpdate if you are not providing a sessionID');
      }
      const notNullQueryUpdate = queryUpdate;
      return Promise.all([
        sessionStore.setQuery(sessionID, notNullQueryUpdate),
        sessionStore.setCache(sessionID, {}),
      ]).then(() => ({sessionID, query: notNullQueryUpdate, isExpired: false}));
    });
  } else {
    const sessionID = nulllableSessionID;
    return Promise.resolve(sessionStore.getQuery(sessionID)).then(nullableQuery => {
      if (nullableQuery == null) {
        console.warn('session expired');
        return {isExpired: true};
      }
      let query = nullableQuery;
      if (queryUpdate) {
        query = mergeQueries(query, queryUpdate);
        return sessionStore.setQuery(sessionID, query).then(() => ({sessionID, query, isExpired: false}));
      }
      return {sessionID, query, isExpired: false};
    });
  }
}

export function runMutations(schema: Schema, mutations: Array<{method: string, args: Object}>, context: Object) {
  return new Promise((resolve, reject) => {
    const results = [];
    function nextMutation(i) {
      if (i >= mutations.length) return resolve(results);
      runMutation(schema, mutations[i], context).done(result => {
        results.push(result);
        nextMutation(i + 1);
      }, reject);
    }
    nextMutation(0);
  });
}

export function runAndDiffQuery(
  schema: Schema,
  sessionID: string,
  sessionStore: SessionStore,
  query: Query,
  context: Context
): Promise<?Object> {
  return Promise.all([
    runQuery(schema, query, context),
    sessionStore.getCache(sessionID),
  ]).then(([data, cache]) => {
    const result = diffCache(cache, data);
    if (result) {
      return sessionStore.setCache(sessionID, data).then(
        () => result,
      );
    }
    return result;
  });
}
