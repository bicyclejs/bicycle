// @flow

let nextID = 0;

class OptimisticValue {
  _pending: boolean;
  _rejected: boolean;
  _value: string;
  _err: ?Error
  constructor() {
    this._pending = true;
    this._rejected = false;
    this._value = '__bicycle_optimistic_value_' + (nextID++) + '__';
    this._err = null;
  }
  resolve(value: string) {
    this._pending = false;
    this._value = value;
  }
  reject(err: Error) {
    this._pending = false;
    this._rejected = true;
    this._err = err;
  }
  isPending(): boolean {
    return this._pending;
  }
  isRejected(): boolean {
    return this._rejected;
  }
  getError(): ?Error {
    return this._err;
  }
  toString(): string {
    return this._value + '';
  }
  inspect(): string {
    return this._value;
  }
  toJSON(): string {
    return this._value;
  }
  valueOf(): string {
    return this._value;
  }
}

export default OptimisticValue;
