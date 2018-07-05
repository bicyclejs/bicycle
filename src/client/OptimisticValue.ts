/**
 * @generated opaque-types
 */

export type PendingOptimisticValue__Base = string;
declare const PendingOptimisticValue__Symbol: unique symbol;

declare class PendingOptimisticValue__Class {
  private __kind: typeof PendingOptimisticValue__Symbol;
}

/**
 * @expose
 * @opaque
 * @base PendingOptimisticValue__Base
 */
type PendingOptimisticValue = PendingOptimisticValue__Base &
  PendingOptimisticValue__Class;
const PendingOptimisticValue = {
  extract(value: PendingOptimisticValue): PendingOptimisticValue__Base {
    return value;
  },

  unsafeCast(value: PendingOptimisticValue__Base): PendingOptimisticValue {
    return value as any;
  },
};
export {PendingOptimisticValue};
export type FulfilledOptimisticValue__Base = string;
declare const FulfilledOptimisticValue__Symbol: unique symbol;

declare class FulfilledOptimisticValue__Class {
  private __kind: typeof FulfilledOptimisticValue__Symbol;
}

/**
 * @expose
 * @opaque
 * @base FulfilledOptimisticValue__Base
 */
type FulfilledOptimisticValue = FulfilledOptimisticValue__Base &
  FulfilledOptimisticValue__Class;
const FulfilledOptimisticValue = {
  extract(value: FulfilledOptimisticValue): FulfilledOptimisticValue__Base {
    return value;
  },

  unsafeCast(value: FulfilledOptimisticValue__Base): FulfilledOptimisticValue {
    return value as any;
  },
};
export {FulfilledOptimisticValue};
export type RejectedOptimisticValue__Base = string;
declare const RejectedOptimisticValue__Symbol: unique symbol;

declare class RejectedOptimisticValue__Class {
  private __kind: typeof RejectedOptimisticValue__Symbol;
}

/**
 * @expose
 * @opaque
 * @base RejectedOptimisticValue__Base
 */
type RejectedOptimisticValue = RejectedOptimisticValue__Base &
  RejectedOptimisticValue__Class;
const RejectedOptimisticValue = {
  extract(value: RejectedOptimisticValue): RejectedOptimisticValue__Base {
    return value;
  },

  unsafeCast(value: RejectedOptimisticValue__Base): RejectedOptimisticValue {
    return value as any;
  },
};
export {RejectedOptimisticValue};
export type OptimisticValue =
  | PendingOptimisticValue
  | FulfilledOptimisticValue
  | RejectedOptimisticValue;
export default OptimisticValue;
