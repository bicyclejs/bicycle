import Promise from 'promise';
import mergeQueries from './utils/merge-queries';
import diffCache from './utils/diff-cache';
import getSessionID from './utils/get-session-id';
import {runQuery, runMutation} from './runner';
import {response as createResponse} from './messages';

export default function handleMessage(
  schema: Object,
  sessionStore: {setQuery: Function, getQuery: Function, setCache: Function, getCache: Function},
  message: {s: ?string, q: ?Object, m: Array<{m: string, a: Object}>},
  context: Object,
): Promise<{sid: ?string, expiredSession: boolean, mutationResults: Array<Object>, data: ?Object}> {
  const sessionID = message.s;
  const queryUpdate = message.q;
  const mutations = message.m.map(m => ({method: m.m, args: m.a}));
  return Promise.all([
    getQuery(sessionID, sessionStore, queryUpdate),
    runMutations(schema, mutations, context),
  ]).then(([{sessionID, query, isExpired}, mutationResults]) => {
    if (isExpired) {
      return createResponse(undefined, mutationResults, undefined);
    } else {
      return runAndDiffQuery(schema, sessionID, sessionStore, query, context).then(
        data => createResponse(sessionID, mutationResults, data)
      );
    }
  });
}

export function getQuery(sessionID: ?string, sessionStore: Object, queryUpdate: ?Object) {
  if (!sessionID) {
    return getSessionID(sessionStore).then(sessionID => {
      return Promise.all([
        sessionStore.setQuery(sessionID, queryUpdate),
        sessionStore.setCache(sessionID, {}),
      ]).then(() => ({sessionID, query: queryUpdate, isExpired: false}));
    });
  } else {
    return sessionStore.getQuery(sessionID).then(query => {
      if (query === null) {
        console.warn('session expired');
        return {isExpired: true};
      }
      if (queryUpdate) {
        query = mergeQueries(query, queryUpdate);
        return sessionStore.setQuery(sessionID, query).then(() => ({sessionID, query, isExpired: false}));
      }
      return {sessionID, query, isExpired: false};
    });
  }
}

export function runMutations(schema: Object, mutations: Array<{method: string, args: Object}>, context: Object) {
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
  schema: Object,
  sessionID: string,
  sessionStore: Object,
  query: Object,
  context: Object
): Promise<Object> {
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
