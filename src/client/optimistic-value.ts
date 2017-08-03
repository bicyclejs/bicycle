import OptimisticValue from '../types/OptimisticValue';

let nextID = 0;

class OptimisticValueImplementation implements OptimisticValue {
  _pending: boolean = true;
  _rejected: boolean = false;
  _err: null | Error = null;
  _value: string;
  constructor() {
    this._value = '__bicycle_optimistic_value_' + nextID++ + '__';
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
  getError(): null | Error {
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

export default OptimisticValueImplementation;
