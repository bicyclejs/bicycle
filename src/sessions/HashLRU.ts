export default class HashLRU<Key, Value> {
  private readonly _max: number;
  private _size = 0;
  private _previous = Object.create(null);
  private _current = Object.create(null);
  constructor(max: number) {
    this._max = max;
    if (typeof max !== 'number' || max < 1 || (max | 0) !== max) {
      throw Error(
        'hashlru must have a max value, of type number, greater than 0',
      );
    }
  }
  private _update(key: Key, value: Value) {
    this._current[key] = value;
    this._size++;
    if (this._size >= this._max) {
      this._size = 0;
      this._previous = this._current;
      this._current = Object.create(null);
    } else if (this._previous[key] !== undefined) {
      this._previous[key] = undefined;
    }
  }

  has(key: Key): boolean {
    return (
      this._previous[key] !== undefined || this._current[key] !== undefined
    );
  }
  remove(key: Key): void {
    if (this._current[key] !== undefined) this._current[key] = undefined;
    if (this._previous[key] !== undefined) this._previous[key] = undefined;
  }
  get(key: Key): Value | void {
    let v = this._current[key];
    if (v !== undefined) return v;
    if ((v = this._previous[key]) !== undefined) {
      this._update(key, v);
      return v;
    }
  }
  set(key: Key, value: Value): void {
    if (this._current[key] !== undefined) this._current[key] = value;
    else this._update(key, value);
  }
  clear(): void {
    this._current = Object.create(null);
    this._previous = Object.create(null);
  }
}
