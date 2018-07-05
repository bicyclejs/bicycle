/**
 * @generated opaque-types
 */

export type MutationID__Base = string;
declare const MutationID__Symbol: unique symbol;

declare class MutationID__Class {
  private __kind: typeof MutationID__Symbol;
}

/**
 * @opaque
 * @base MutationID__Base
 */
type MutationID = MutationID__Class;
const MutationID = {
  extract(value: MutationID): MutationID__Base {
    return value as any;
  },

  unsafeCast(value: MutationID__Base): MutationID {
    return value as any;
  },
};
export default MutationID;
