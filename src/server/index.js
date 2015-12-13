export {scalar, type, computed, prepare} from './schema';


export function createSessionFactory(schema, store) {
  return function (sessionId, root, ctx) {
    return {
      addQuery(query, params) {
        let prunedResult = {};
        // TODO: params
        return schema.run(root, ctx, query).then(result => {
          return Promise.all(Object.keys(result).map(id => {
            return store.get(sessionId, 'node:' + id).then(
              clientValue => {
                if (clientValue === undefined) {
                  prunedResult[id] = result[id];
                  store.set(sessionId, 'node:' + id, result[id]).done(
                    null,
                    err => console.error('Error saving cache: ' + err.stack)
                  );
                } else {
                  let serverResult = prune(clientValue, result[id]);
                  if (serverResult) {
                    prunedResult[id] = serverResult;
                    store.set(sessionId, 'node:' + id, {...clientValue, ...result[id]}).done(
                      null,
                      err => console.error('Error saving cache: ' + err.stack)
                    );
                  }
                }
              }
            );
          })).then(() => prunedResult);
        });
      },
    };
  };
}
function prune(clientValue, serverValue) {
  let result = null;
  Object.keys(serverValue).forEach(key => {
    if (!equals(clientValue[key], serverValue[key])) {
      if (!result) result = {};
      result[key] = serverValue[key];
    }
  });
  return result;
}
function equals(a, b) {
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.every((val, i) => val === b[i]);
  }
  return a === b;
}
