import Promise from 'promise';
import mergeQueries from './utils/merge-queries';
import diffCache from './utils/diff-cache';
import getSessionID from './utils/get-session-id';
import {runQuery, runMutation} from './runner';

export default function handleMessage(
  schema: Object,
  sessionStore: {setQuery: Function, getQuery: Function, setCache: Function, getCache: Function},
  message: {sessionID: ?string, queryUpdate: ?Object, mutations: Array<{method: string, args: Object}>},
  context: Object,
): Promise<{sessionID: ?string, expiredSession: boolean, mutationResults: Array<Object>, data: ?Object}> {
  return Promise.all([
    getQuery(message.sessionID, sessionStore, message.queryUpdate),
    runMutations(schema, message.mutations, context),
  ]).then(([{sessionID, query, isExpired}, mutationResults]) => {
    if (isExpired) {
      return {expiredSession: true, mutationResults};
    } else {
      return runAndDiffQuery(schema, sessionID, sessionStore, query, context).then(
        data => ({sessionID, expiredSession: false, mutationResults, data})
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

export function runAndDiffQuery(schema: Object, sessionID: string, sessionStore: Object, query: Object, context: Object) {
  return Promise.all([
    runQuery(schema, query, context),
    sessionStore.getCache(sessionID),
  ]).then(([data, cache]) => {
    const {result, changed} = diffCache(cache, data);
    if (changed) {
      return sessionStore.setCache(sessionID, data).then(
        () => result,
      );
    }
    return result;
  });
}
