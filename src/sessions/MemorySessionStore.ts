import LockByID from '@authentication/lock-by-id';
import SessionID from '../types/SessionID';
import SessionStore, {Session} from './SessionStore';
import HashLRU from './HashLRU';

const DEFAULT_SIZE = process.env.BICYCLE_SESSION_STORE_SIZE
  ? parseInt(process.env.BICYCLE_SESSION_STORE_SIZE, 10)
  : 100;
class MemorySessionStore implements SessionStore {
  private readonly _cache: HashLRU<SessionID, Session>;
  private readonly _lock = new LockByID();
  constructor(size: number = DEFAULT_SIZE) {
    this._cache = new HashLRU(size);
  }
  tx<T>(
    id: SessionID,
    fn: (session: Session | null) => Promise<{session: Session; result: T}>,
  ): Promise<T> {
    return this._lock.withLock(SessionID.extract(id), async () => {
      const {session, result} = await fn(this._cache.get(id) || null);
      this._cache.set(id, session);
      return result;
    });
  }
}

export default MemorySessionStore;
