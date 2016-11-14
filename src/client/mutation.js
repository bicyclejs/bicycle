import Promise from 'promise';
import OptimisticValue from './optimistic-value';

function extractRequiredValues(args, results = []) {
  if (args && typeof args === 'object' && args instanceof OptimisticValue) {
    results.push(args);
    return results;
  }
  if (args && typeof args === 'object' && args.toJSON) args = args.toJSON();
  if (!(args && typeof args === 'object')) return results;
  if (Array.isArray(args)) {
    args.forEach(v => extractRequiredValues(v, results));
  } else {
    Object.keys(args).forEach(n => extractRequiredValues(args[n], results));
  }
  return results;
}
class Mutation {
  constructor(method: string, args: Object, optimisticUpdate) {
    this.mutation = {method, args};
    this._optimisticUpdate = optimisticUpdate || null;
    this._getOptimisticValue = this._getOptimisticValue.bind(this);
    this._optimisticValuesRequired = extractRequiredValues(args);
    this._optimisticValuesSuplied = {};
    this._pending = true;
    this._blocked = true;
    this._rejected = false;
    this._result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this.updateStatus();
  }
  _getOptimisticValue(name): OptimisticValue {
    return this._optimisticValuesSuplied[name] || (this._optimisticValuesSuplied[name] = new OptimisticValue());
  }
  updateStatus() {
    if (!this._pending) return;
    if (!this._blocked) return;
    this._blocked = false;
    for (let i = 0; i < this._optimisticValuesRequired.length; i++) {
      const value = this._optimisticValuesRequired[i];
      if (value.isRejected()) {
        this.reject(value.getError());
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
  applyOptimistic(cache: Object): ?Object {
    if (!this._optimisticUpdate) return null;
    return this._optimisticUpdate.call(null, this.mutation, cache, this._getOptimisticValue);
  }
  getResult(): Promise<any> {
    return this._result;
  }
  resolve(result: any) {
    this._pending = false;
    this._blocked = false;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      if (result && typeof result === 'object' && (name in result)) {
        this._optimisticValuesSuplied[name].resolve(result[name]);
      } else {
        this._optimisticValuesSuplied[name].reject(
          new Error('Could not resolve missing optimistic value "' + name + '"')
        );
      }
    });
    this._resolve(result);
  }
  reject(err: Error) {
    this._pending = false;
    this._rejected = true;
    this._blocked = false;
    Object.keys(this._optimisticValuesSuplied).forEach(name => {
      this._optimisticValuesSuplied[name].reject(err);
    });
    this._reject(err);
  }
}

export default Mutation;
