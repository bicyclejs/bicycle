import Promise from 'promise';
import {mergeQueries, UPDATE_QUERY, MUTATE} from './utils';

export default function (batch, sessionID, sessionStore, runMutation) {
  const updateQuery = batch.filter(request => request.action === UPDATE_QUERY);
  const mutations = batch.filter(request => request.action === MUTATE).reverse();
  const queryPromise = sessionStore.getQuery(sessionID).then(query => {
    if (updateQuery.length) {
      query = updateQuery.reduce((query, update) => mergeQueries(query, update.args), query);
      return sessionStore.setQuery(sessionID, query).then(() => query);
    }
    return query;
  });
  const mutationsPromise = new Promise((resolve, reject) => {
    function nextMutation() {
      if (!mutations.length) return resolve();
      Promise.resolve(null).then(() => runMutation(mutations.pop().args)).done(nextMutation, reject);
    }
    nextMutation();
  });
  return mutationsPromise.then(() => queryPromise);
}
