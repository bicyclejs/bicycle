/**
 * @generated opaque-types
 */

export type SessionID__Base = string;
declare const SessionID__Symbol: unique symbol;

declare class SessionID__Class {
  private __kind: typeof SessionID__Symbol;
}

/**
 * @opaque
 * @base SessionID__Base
 */
type SessionID = SessionID__Class;
const SessionID = {
  extract(value: SessionID): SessionID__Base {
    return value as any;
  },

  unsafeCast(value: SessionID__Base): SessionID {
    return value as any;
  },
};
export default SessionID;
