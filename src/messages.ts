import Cache from './types/Cache';
import SessionID from './types/SessionID';
import Query, {QueryUpdate} from './types/Query';
import ClientRequest from './types/ClientRequest';
import ServerPreparation from './types/ServerPreparation';

export function request(
  sessionID: void | SessionID,
  queryUpdate: void | QueryUpdate,
  mutations: void | Array<{method: string; args: any}>,
): ClientRequest {
  return {
    s: sessionID,
    q: queryUpdate,
    m: mutations
      ? mutations.map(({method, args}) => ({m: method, a: args}))
      : undefined,
  };
}

export function serverPreparation(
  sessionID: SessionID,
  query: Query,
  cache: Cache,
): ServerPreparation {
  return {
    s: sessionID,
    q: query,
    c: cache,
  };
}
