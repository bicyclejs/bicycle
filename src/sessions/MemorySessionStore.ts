import LockByID from '@authentication/lock-by-id';
import SessionID from '../types/SessionID';
import SessionStore, {Session} from './SessionStore';
import HashLRU from './HashLRU';

class MemorySessionStore implements SessionStore {
  private readonly _cache: HashLRU<SessionID, Session>;
  private readonly _lock = new LockByID();
  constructor(size: number = 100) {
    this._cache = new HashLRU(size);
  }
  tx<T>(
    id: SessionID,
    fn: (session: Session | null) => Promise<{session: Session; result: T}>,
  ): Promise<T> {
    return this._lock.withLock(id, async () => {
      const {session, result} = await fn(this._cache.get(id) || null);
      this._cache.set(id, session);
      return result;
    });
  }
}

export default MemorySessionStore;
