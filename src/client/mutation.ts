import OptimisticValueStore, {
  PendingOptimisticValue,
} from './OptimisticValueStore';
import {BaseCache, OptimisticUpdateHandler} from './optimistic';

class Mutation {
  public readonly mutation: {method: string; args: any};
  private readonly _structuredMutation: {
    objectName: string;
    methodName: string;
    args: any;
  };
  private _optimisticUpdateHandler: void | OptimisticUpdateHandler;
  private _optimisticValuesRequired: PendingOptimisticValue[];
  private _optimisticValuesSuplied: {
    [key: string]: PendingOptimisticValue;
  } = {};
  private _optimisticValueStore: OptimisticValueStore;
  private _pending: boolean = true;
  private _rejected: boolean = false;
  private readonly _result: Promise<any>;
  private _resolve: (value: any) => void;
  private _reject: (err: any) => void;
  constructor(
    method: string,
    args: any,
    optimisticUpdate: void | OptimisticUpdateHandler,
    optimisticValueStore: OptimisticValueStore,
  ) {
    this._optimisticValueStore = optimisticValueStore;
    const result = optimisticValueStore.normalizeValue(args);
    this._optimisticValuesRequired = result.pendingKeys;
    this.mutation = {method, args: result.value};
    this._structuredMutation = {
      objectName: method.split('.')[0],
      methodName: method.split('.')[1],
      args,
    };
    this._optimisticUpdateHandler = optimisticUpdate;

    this._result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this.updateStatus();
  }
  _getOptimisticValue = (name: string): PendingOptimisticValue => {
    return (
      this._optimisticValuesSuplied[name] ||
      (this._optimisticValuesSuplied[
        name
      ] = this._optimisticValueStore.createValue())
    );
  };
  updateStatus() {
    if (!this._pending) return;
    if (this._optimisticValuesRequired.length === 0) return;
    const result = this._optimisticValueStore.normalizeValue(
      this.mutation.args,
    );
    this.mutation.args = result.value;
    this._structuredMutation.args = result.value;
    if (result.rejection) {
      this.reject(result.rejection);
    }
    this._optimisticValuesRequired = result.pendingKeys;
  }
  isPending(): boolean {
    return this._pending;
  }
  isRejected() {
    return this._rejected;
  }
  isBlocked(): boolean {
    return !this._rejected && this._optimisticValuesRequired.length !== 0;
  }
  applyOptimistic(cache: BaseCache): void {
    const handler = this._optimisticUpdateHandler;
    if (!handler) return;
    handler(this._structuredMutation, cache, this._getOptimisticValue);
  }
  getResult(): Promise<any> {
    return this._result;
  }
  resolve(result: any) {
    this._pending = false;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      const v = this._optimisticValuesSuplied[name];
      if (v) {
        if (result && typeof result === 'object' && name in result) {
          this._optimisticValueStore.resolve(v, result[name]);
        } else {
          this._optimisticValueStore.reject(
            v,
            new Error(
              'Could not resolve missing optimistic value "' + name + '"',
            ),
          );
        }
      }
    });
    this._resolve(result);
  }
  reject(err: Error) {
    this._pending = false;
    this._rejected = true;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      const v = this._optimisticValuesSuplied[name];
      this._optimisticValueStore.reject(v, err);
    });
    this._reject(err);
  }
}

export default Mutation;
