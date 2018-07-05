/**
 * @generated opaque-types
 */

export type SessionVersion__Base = string;
declare const SessionVersion__Symbol: unique symbol;

declare class SessionVersion__Class {
  private __kind: typeof SessionVersion__Symbol;
}

/**
 * @opaque
 * @base SessionVersion__Base
 */
type SessionVersion = SessionVersion__Class;
const SessionVersion = {
  extract(value: SessionVersion): SessionVersion__Base {
    return value as any;
  },

  unsafeCast(value: SessionVersion__Base): SessionVersion {
    return value as any;
  },
};
export default SessionVersion;
