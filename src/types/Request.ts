import Mutation from '../client/mutation';
import MutationID from './MutationID';
import SessionID from './SessionID';
import SessionVersion from './SessionVersion';
import Query, {QueryUpdate} from './Query';

export const enum RequestKind {
  NEW_SESSION = 1,
  UPDATE = 2,
  RESTORE_SESSION = 3,
}
export interface NewSession {
  readonly k: RequestKind.NEW_SESSION;
  readonly q: Query;
}
export interface Update {
  readonly k: RequestKind.UPDATE;
  readonly s: SessionID;
  readonly v: SessionVersion;
  readonly q: void | QueryUpdate;
  readonly m: void | {m: string; a: any; i: MutationID}[];
}
export interface RestoreSession {
  readonly k: RequestKind.RESTORE_SESSION;
  readonly s: SessionID;
  readonly q: Query;
  readonly m: void | {m: string; a: any; i: MutationID}[];
}
type Request = NewSession | Update | RestoreSession;
export default Request;

export function createNewSessionRequest(query: Query): Request {
  return {
    k: RequestKind.NEW_SESSION,
    q: query,
  };
}

export function createUpdateRequest(
  sessionID: SessionID,
  version: SessionVersion,
  query: void | QueryUpdate,
  mutations: void | Mutation[],
): Request {
  return {
    k: RequestKind.UPDATE,
    s: sessionID,
    v: version,
    q: query,
    m: mutations
      ? mutations.map(({mutation: {method, args, id}}) => ({
          m: method,
          a: args,
          i: id,
        }))
      : undefined,
  };
}
export function createRestoreRequest(
  sessionID: SessionID,
  query: Query,
  mutations: void | Mutation[],
): Request {
  return {
    k: RequestKind.RESTORE_SESSION,
    s: sessionID,
    q: query,
    m: mutations
      ? mutations.map(({mutation: {method, args, id}}) => ({
          m: method,
          a: args,
          i: id,
        }))
      : undefined,
  };
}
