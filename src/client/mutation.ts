import Promise from 'promise';
import OptimisticValue from './optimistic-value';
import Cache from '../types/Cache';
import OptimisticUpdate from '../types/OptimisticUpdate';

function extractRequiredValues(
  args: any,
  results: OptimisticValue[] = [],
): OptimisticValue[] {
  if (args && typeof args === 'object' && args instanceof OptimisticValue) {
    results.push(args);
    return results;
  }
  if (args && typeof args === 'object' && typeof args.toJSON === 'function')
    args = args.toJSON();
  if (!(args && typeof args === 'object')) return results;
  const objArgs = args;
  if (Array.isArray(objArgs)) {
    objArgs.forEach(v => extractRequiredValues(v, results));
  } else {
    Object.keys(objArgs).forEach(n =>
      extractRequiredValues(objArgs[n], results),
    );
  }
  return results;
}

class Mutation {
  public readonly mutation: {method: string; args: Object};
  private _optimisticUpdate: void | OptimisticUpdate;
  private _optimisticValuesRequired: OptimisticValue[];
  private _optimisticValuesSuplied: {[key: string]: OptimisticValue | void};
  private _pending: boolean = true;
  private _blocked: boolean = true;
  private _rejected: boolean = false;
  private readonly _result: Promise<any>;
  private _resolve: (value: any) => void;
  private _reject: (err: any) => void;
  constructor(
    method: string,
    args: Object,
    optimisticUpdate: void | OptimisticUpdate,
  ) {
    this.mutation = {method, args};
    this._optimisticUpdate = optimisticUpdate;
    this._optimisticValuesRequired = extractRequiredValues(args);
    this._optimisticValuesSuplied = {};
    this._result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this.updateStatus();
  }
  _getOptimisticValue = (name: string): OptimisticValue => {
    return (
      this._optimisticValuesSuplied[name] ||
      (this._optimisticValuesSuplied[name] = new OptimisticValue())
    );
  };
  updateStatus() {
    if (!this._pending) return;
    if (!this._blocked) return;
    this._blocked = false;
    for (let i = 0; i < this._optimisticValuesRequired.length; i++) {
      const value = this._optimisticValuesRequired[i];
      if (value.isRejected()) {
        this.reject(value.getError() as Error);
      } else if (value.isPending()) {
        this._blocked = true;
      }
    }
  }
  isPending(): boolean {
    return this._pending;
  }
  isRejected() {
    return this._rejected;
  }
  isBlocked(): boolean {
    return this._blocked;
  }
  applyOptimistic(cache: Cache): null | void | Cache {
    if (!this._optimisticUpdate) return null;
    return this._optimisticUpdate.call(
      null,
      this.mutation,
      cache,
      this._getOptimisticValue,
    );
  }
  getResult(): Promise<any> {
    return this._result;
  }
  resolve(result: any) {
    this._pending = false;
    this._blocked = false;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      const v = this._optimisticValuesSuplied[name];
      if (v) {
        if (result && typeof result === 'object' && name in result) {
          v.resolve(result[name]);
        } else {
          v.reject(
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
    this._blocked = false;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      const v = this._optimisticValuesSuplied[name];
      if (v) {
        v.reject(err);
      }
    });
    this._reject(err);
  }
}

export default Mutation;
