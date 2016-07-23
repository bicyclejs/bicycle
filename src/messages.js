export function request(sessionID?: string, queryUpdate?: Object, mutations?: Array): Object {
  return {
    s: sessionID,
    q: queryUpdate,
    m: mutations.map(({method, args}) => ({m: method, a: args})),
  };
}

export function response(sessionID?: string, mutationResults?: Array, cacheUpdate?: Object): Object {
  return {
    s: sessionID,
    d: cacheUpdate,
    m: mutationResults,
  };
}

export function serverPreparation(sessionID: string, query: Object, cache: Object): Object {
  return {
    s: sessionID,
    q: query,
    c: cache,
  };
}
