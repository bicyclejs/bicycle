import MutationResult from './MutationResult';
import SessionID from './SessionID';
import Cache, {CacheUpdate} from './Cache';

export const enum ServerResponseKind {
  EXPIRED = 0,
  NEW_SESSION = 1,
  UPDATE = 2,
}
export interface ServerResponseExpired {
  readonly k: ServerResponseKind.EXPIRED;
  readonly m: void | MutationResult<any>[];
}
export interface ServerResponseNewSession {
  readonly k: ServerResponseKind.NEW_SESSION;
  readonly s: SessionID;
  readonly d: Cache;
  readonly m: void | MutationResult<any>[];
}
export interface ServerResponseUpdate {
  readonly k: ServerResponseKind.UPDATE;
  readonly d: void | CacheUpdate;
  readonly m: void | MutationResult<any>[];
}
type ServerResponse =
  | ServerResponseExpired
  | ServerResponseNewSession
  | ServerResponseUpdate;
export default ServerResponse;

export function createExpiredResponse(
  mutationResults: void | MutationResult<any>[],
): ServerResponseExpired {
  return {
    k: ServerResponseKind.EXPIRED,
    m: mutationResults,
  };
}

export function createNewSessionResponse(
  sessionID: SessionID,
  data: Cache,
  mutationResults: void | MutationResult<any>[],
): ServerResponseNewSession {
  return {
    k: ServerResponseKind.NEW_SESSION,
    s: sessionID,
    d: data,
    m: mutationResults,
  };
}

export function createUpdateResponse(
  data: void | CacheUpdate,
  mutationResults: void | MutationResult<any>[],
): ServerResponseUpdate {
  return {
    k: ServerResponseKind.UPDATE,
    d: data,
    m: mutationResults,
  };
}
