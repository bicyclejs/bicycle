import SessionID from './SessionID';
import {QueryUpdate} from './Query';
export default interface ClientRequest {
  readonly s: void | SessionID; // undefined if requesing a new session
  readonly q: void | QueryUpdate;
  readonly m: void | {m: string; a: any}[];
};
