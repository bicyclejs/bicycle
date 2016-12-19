let nextID = 0;

class OptimisticValue {
  constructor() {
    this._pending = true;
    this._rejected = false;
    this._value = '__bicycle_optimistic_value_' + (nextID++) + '__';
    this._err = null;
  }
  resolve(value) {
    this._pending = false;
    this._value = value;
  }
  reject(err) {
    this._pending = false;
    this._rejected = true;
    this._err = err;
  }
  isPending() {
    return this._pending;
  }
  isRejected() {
    return this._rejected;
  }
  getError() {
    return this._err;
  }
  toString() {
    return this._value + '';
  }
  inspect() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
  valueOf() {
    return this._value;
  }
}

export default OptimisticValue;
