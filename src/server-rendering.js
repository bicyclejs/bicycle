import Promise from 'promise';
import notEqual from './utils/not-equal';
import mergeQueries from './utils/merge-queries';
import runQueryAgainstCache from './utils/run-query-against-cache';
import getSessionID from './utils/get-session-id';
import {runQuery} from './runner';


class FakeClient {
  constructor(sessionID) {
    this._sessionID = sessionID;
    this._query = {};
    this._cache = {root: {}};
  }
  _serverPreparation() {
    return {
      sessionID: this._sessionID,
      query: this._query,
      cache: this._cache,
    };
  }
  queryCache(query: Object): {result: Object, loaded: boolean, errors: Array<string>} {
    this._query = mergeQueries(this._query, query);
    return runQueryAgainstCache(this._cache, this._cache['root'], query);
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
            if (!notEqual(oldServerPreparation.query, newServerPreparation.query)) {
              return resolve({serverPreparation: newServerPreparation, result});
            }
            runQuery(
              schema,
              newServerPreparation.query,
              context
            ).done(data => {
              if (notEqual(newServerPreparation.cache, data)) {
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
        sessionStore.setCache(result.serverPreparation.sessionID, result.serverPreparation.cache),
        sessionStore.setQuery(result.serverPreparation.sessionID, result.serverPreparation.query),
      ]).then(() => result);
    });
  };
}
