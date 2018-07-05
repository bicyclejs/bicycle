import OptimisticValue, {
  PendingOptimisticValue,
  FulfilledOptimisticValue,
  RejectedOptimisticValue,
} from './OptimisticValue';

export {
  OptimisticValue,
  PendingOptimisticValue,
  FulfilledOptimisticValue,
  RejectedOptimisticValue,
};

function extractID(value: OptimisticValue): number {
  const match = /^__bicycle_optimistic_value_[0-9a-f]+_([0-9]+)__$/.exec(value);
  return parseInt(match![1], 10);
}

export default class OptimisticValueStore {
  private readonly _key: string;
  private _nextID: number;
  private readonly _fulfilled: Map<number, string> = new Map();
  private readonly _rejected: Map<number, Error> = new Map();
  constructor(key?: string, nextID?: number) {
    // make it difficult to intentionally forge the optimistic values
    this._key =
      key ||
      Math.random()
        .toString(16)
        .substr(2);
    this._nextID = nextID || 0;
  }
  isOptimisticValue(value: any): value is OptimisticValue {
    if (typeof value !== 'string') {
      return false;
    }
    const match = /^__bicycle_optimistic_value_([0-9a-f]+)_[0-9]+__$/.exec(
      value,
    );
    if (!match) return false;
    return match[1] === this._key;
  }
  createValue(): PendingOptimisticValue {
    const id = this._nextID++;
    return PendingOptimisticValue.unsafeCast(
      `__bicycle_optimistic_value_${this._key}_${id}__`,
    );
  }
  resolve(optimisticValue: PendingOptimisticValue, value: string) {
    const id = extractID(optimisticValue);
    if (!this._fulfilled.has(id) && !this._rejected.has(id)) {
      this._fulfilled.set(id, value);
    }
  }
  reject(optimisticValue: PendingOptimisticValue, err: Error) {
    const id = extractID(optimisticValue);
    if (!this._fulfilled.has(id) && !this._rejected.has(id)) {
      this._rejected.set(id, err);
    }
  }
  isFulfilled(value: OptimisticValue): value is FulfilledOptimisticValue {
    return this._fulfilled.has(extractID(value));
  }
  isRejected(value: OptimisticValue): value is RejectedOptimisticValue {
    return this._rejected.has(extractID(value));
  }
  getValue(value: FulfilledOptimisticValue): string {
    return this._fulfilled.get(extractID(value))!;
  }
  getError(value: RejectedOptimisticValue): Error {
    return this._rejected.get(extractID(value))!;
  }
  normalizeValue(
    value: any,
  ): {
    value: any;
    pendingKeys: PendingOptimisticValue[];
    rejection: null | Error;
  } {
    const store = this;
    const pendingKeys: PendingOptimisticValue[] = [];
    let rejection: null | Error = null;
    function recurse(value: any): any {
      if (store.isOptimisticValue(value)) {
        if (store.isFulfilled(value)) {
          return store.getValue(value);
        } else if (store.isRejected(value)) {
          rejection = store.getError(value);
        } else {
          pendingKeys.push(value as PendingOptimisticValue);
          return value;
        }
      }
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.map(recurse);
        } else {
          const result = {};
          Object.keys(value).forEach(key => {
            result[key] = recurse(value[key]);
          });
          return result;
        }
      }
      return value;
    }
    return {value: recurse(value), pendingKeys, rejection};
  }
}
