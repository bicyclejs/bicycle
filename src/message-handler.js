import Promise from 'promise';
import {mergeQueries, UPDATE_QUERY, MUTATE, INIT_SESSION} from './utils';

export default function (
  batch: Array<Object>,
  sessionID: string,
  sessionStore: {setQuery: Function, getQuery: Function, setCache: Function},
  runMutation: Function,
): Promise<{query: Object, newSession: boolean, expiredSession: boolean}> {
  const initSession = !!(batch.filter(request => request.action === INIT_SESSION).length);
  const updateQuery = batch.filter(request => request.action === UPDATE_QUERY);
  const mutations = batch.filter(request => request.action === MUTATE).reverse();
  const queryPromise = (
    initSession
    ? Promise.all([
      sessionStore.setQuery(sessionID, updateQuery[updateQuery.length - 1].args),
      sessionStore.setCache(sessionID, {}),
    ]).then(
      () => ({query: updateQuery[updateQuery.length - 1].args, newSession: true, expiredSession: false})
    )
    : sessionStore.getQuery(sessionID).then(query => {
      if (query === null) {
        console.warn('session expired');
        return {
          query: {},
          newSession: false,
          expiredSession: true,
        };
      }
      if (updateQuery.length) {
        query = updateQuery.reduce((query, update) => mergeQueries(query, update.args), query);
        return sessionStore.setQuery(sessionID, query).then(() => ({query, newSession: false, expiredSession: false}));
      }
      return ({query, newSession: false, expiredSession: false});
    })
  );
  const mutationsPromise = new Promise((resolve, reject) => {
    function nextMutation() {
      if (!mutations.length) return resolve();
      Promise.resolve(null).then(() => runMutation(mutations.pop().args)).done(nextMutation, reject);
    }
    nextMutation();
  });
  return mutationsPromise.then(() => queryPromise);
}
