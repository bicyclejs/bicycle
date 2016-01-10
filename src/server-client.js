import Promise from 'promise';
import DevNullSession from './sessions/devnull.js';
import {requestHandler} from './server';
import {
  mergeQueries,
  runQueryAgainstCache,
  areDifferent,
  UPDATE_QUERY,
  INIT_SESSION,
} from './utils';

const dnull = new DevNullSession();
export default function prepare(schema: Object, sessionStore: {setCache: Function, setQuery: Function}, fn: Function) {
  const handleRequest = requestHandler(schema, dnull);
  return (context, ...args) => {
    const client = new ServerClient(schema);
    return new Promise((resolve, reject) => {
      function next() {
        try {
          const oldServerPreparation = client.serverPreparation();
          const result = fn(client, ...args);
          const newServerPreparation = client.serverPreparation();
          if (!areDifferent(oldServerPreparation.query, newServerPreparation.query)) {
            return resolve({serverPreparation: newServerPreparation, result});
          }
          handleRequest(
            newServerPreparation.sessionID,
            context,
            [
              {action: INIT_SESSION},
              {action: UPDATE_QUERY, args: newServerPreparation.query},
            ],
          ).done(response => {
            if (!areDifferent(newServerPreparation.cache, response.data)) {
              return resolve({serverPreparation: newServerPreparation, result});
            }
            client._cache = response.data;
            next();
          }, reject);
        } catch (ex) {
          reject(ex);
        }
      }
      next();
    }).then(result => {
      return Promise.all([
        sessionStore.setCache(result.serverPreparation.sessionID, result.serverPreparation.cache),
        sessionStore.setQuery(result.serverPreparation.sessionID, result.serverPreparation.query),
      ]).then(() => result);
    });
  };
}
function ServerClient(schema) {
  this._sessionID = (Date.now()).toString(35) + Math.random().toString(35).substr(2, 7);
  this._query = {};
  this._cache = {root: {}};
}
ServerClient.prototype.serverPreparation = function () {
  return {
    sessionID: this._sessionID,
    query: this._query,
    cache: this._cache,
  };
};
ServerClient.prototype.queryCache = function (query) {
  this._query = mergeQueries(this._query, query);
  return runQueryAgainstCache(this._cache, this._cache['root'], query);
};
ServerClient.prototype.update = function (name, args) {
  throw new Error('BicycleServerClient does not support "update"');
};
ServerClient.prototype.subscribe = function (query, fn) {
  const {result, notLoaded} = this.queryCache(query);
  fn(result, !notLoaded);
};
