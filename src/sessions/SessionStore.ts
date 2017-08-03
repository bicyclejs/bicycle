import Cache from '../types/Cache';
import Query from '../types/Query';
import SessionID from '../types/SessionID';

export default interface SessionStore {
  getCache(sessionId: SessionID): PromiseLike<Cache | null>;
  setCache(sessionId: SessionID, data: Cache): PromiseLike<void>;
  getQuery(sessionId: SessionID): PromiseLike<Query | null>;
  setQuery(sessionId: SessionID, query: Query): PromiseLike<void>;
  readonly getSessionID?: () => PromiseLike<SessionID>;
};
