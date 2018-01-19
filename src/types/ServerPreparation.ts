import Cache from './Cache';
import SessionID from './SessionID';
import SessionVersion from './SessionVersion';
import Query from './Query';

export default interface ServerPreparation {
  readonly s: SessionID;
  readonly v: SessionVersion;
  readonly q: Query;
  readonly c: Cache;
};

export function createServerPreparation(
  sessionID: SessionID,
  version: SessionVersion,
  query: Query,
  cache: Cache,
): ServerPreparation {
  return {
    s: sessionID,
    v: version,
    q: query,
    c: cache,
  };
}
