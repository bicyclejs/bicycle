import Cache from '../types/Cache';
import MutationResult from '../types/MutationResult';
import Query from '../types/Query';
import SessionID from '../types/SessionID';
import SessionVersion from '../types/SessionVersion';

export interface SessionState {
  query: Query;
  cache: Cache;
  version: SessionVersion;
}

export interface Session {
  versions: SessionState[];
  mutations: {[key: string /* MutationID */]: MutationResult<any>};
}

export default interface SessionStore {
  readonly getSessionID?: () => PromiseLike<SessionID>;
  tx<T>(
    id: SessionID,
    fn: (session: Session | null) => Promise<{session: Session; result: T}>,
  ): Promise<T>;
}
