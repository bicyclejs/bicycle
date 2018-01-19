import MutationResult from './MutationResult';
import SessionID from './SessionID';
import SessionVersion from './SessionVersion';
import Cache, {CacheUpdate} from './Cache';

export const enum ServerResponseKind {
  EXPIRED = 0,
  NEW_SESSION = 1,
  UPDATE = 2,
  RESTORE = 3,
}
export interface ServerResponseExpired {
  readonly k: ServerResponseKind.EXPIRED;
  readonly m: void | MutationResult<any>[];
}
export interface ServerResponseNewSession {
  readonly k: ServerResponseKind.NEW_SESSION;
  readonly s: SessionID;
  readonly v: SessionVersion;
  readonly d: Cache;
}
export interface ServerResponseUpdate {
  readonly k: ServerResponseKind.UPDATE;
  readonly v: SessionVersion;
  readonly d: void | CacheUpdate;
  readonly m: void | MutationResult<any>[];
}
export interface ServerResponseRestore {
  readonly k: ServerResponseKind.RESTORE;
  readonly v: SessionVersion;
  readonly d: Cache;
  readonly m: void | MutationResult<any>[];
}
type ServerResponse =
  | ServerResponseExpired
  | ServerResponseNewSession
  | ServerResponseUpdate
  | ServerResponseRestore;
export default ServerResponse;

export function createExpiredSessionResponse(
  mutationResults: void | MutationResult<any>[],
): ServerResponseExpired {
  return {
    k: ServerResponseKind.EXPIRED,
    m: mutationResults,
  };
}

export function createNewSessionResponse(
  sessionID: SessionID,
  version: SessionVersion,
  data: Cache,
): ServerResponseNewSession {
  return {
    k: ServerResponseKind.NEW_SESSION,
    s: sessionID,
    v: version,
    d: data,
  };
}

export function createUpdateResponse(
  version: SessionVersion,
  data: void | CacheUpdate,
  mutationResults: void | MutationResult<any>[],
): ServerResponseUpdate {
  return {
    k: ServerResponseKind.UPDATE,
    v: version,
    d: data,
    m: mutationResults,
  };
}
export function createRestoreResponse(
  version: SessionVersion,
  data: Cache,
  mutationResults: void | MutationResult<any>[],
): ServerResponseRestore {
  return {
    k: ServerResponseKind.RESTORE,
    v: version,
    d: data,
    m: mutationResults,
  };
}
