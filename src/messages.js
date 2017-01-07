// @flow

import type {ClientRequest, MutationResult, Query, ServerPreparation, ServerResponse, SessionID} from './flow-types';

export function request(
  sessionID?: string,
  queryUpdate?: Query,
  mutations?: Array<{method: string, args: Object}>,
): ClientRequest {
  return {
    s: sessionID,
    q: queryUpdate,
    m: mutations ? mutations.map(({method, args}) => ({m: method, a: args})) : undefined,
  };
}

export function response(
  sessionID?: SessionID,
  mutationResults?: Array<MutationResult>,
  cacheUpdate?: Object,
): ServerResponse {
  return {
    s: sessionID,
    d: cacheUpdate,
    m: mutationResults,
  };
}

export function serverPreparation(sessionID: SessionID, query: Query, cache: Object): ServerPreparation {
  return {
    s: sessionID,
    q: query,
    c: cache,
  };
}
