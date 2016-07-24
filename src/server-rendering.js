import Promise from 'promise';
import notEqual from './utils/not-equal';
import mergeQueries from './utils/merge-queries';
import runQueryAgainstCache from './utils/run-query-against-cache';
import getSessionID from './utils/get-session-id';
import {runQuery} from './runner';
import {serverPreparation as createServerPreparation} from './messages';


class FakeClient {
  constructor(sessionID) {
    this._sessionID = sessionID;
    this._query = {};
    this._cache = {root: {}};
  }
  _serverPreparation() {
    return createServerPreparation(
      this._sessionID,
      this._query,
      this._cache,
    );
  }
  queryCache(query: Object): {result: Object, loaded: boolean, errors: Array<string>} {
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

export default function prepare(schema: Object, sessionStore: {setCache: Function, setQuery: Function}, fn: Function) {
  return (context, ...args) => {
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
