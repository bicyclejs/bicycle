import Cache from './Cache';
import SessionID from './SessionID';
import Query from './Query';

export default interface ServerPreparation {
  readonly s: SessionID;
  readonly q: Query;
  readonly c: Cache;
};
