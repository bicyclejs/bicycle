import suggestMatch from '../utils/suggest-match';
import typeNameFromValue from '../utils/type-name-from-value';

class Type<T> {
  typeName: string;
  _validate: (value: any, context: string) => value is T;
  constructor(
    typeName: string,
    validate: (value: any, context: string) => value is T,
  ) {
    this.typeName = typeName;
    this._validate = validate;
  }
  validate(value: {}, name: string = 'value'): T {
    if (!this._validate(value, name)) {
      throw new Error(
        'Expected ' +
          name +
          ' to be a ' +
          this.typeName +
          ' but got ' +
          typeNameFromValue(value),
      );
    }
    return value;
  }
  or<S>(t: Type<S>): Type<T | S> {
    return new Type<T | S>(
      this.typeName + ' | ' + t.typeName,
      (value, context): value is T | S =>
        this._validate(value, context) || t._validate(value, context),
    );
  }
}

export const Fn = new Type<(...args: any[]) => any>(
  'function',
  (v): v is (...args: any[]) => any => typeof v === 'function',
);
export const String = new Type<string>(
  'string',
  (v): v is string => typeof v === 'string',
);
export const Void = new Type<void>(
  'undefined',
  (v): v is void => v === undefined,
);
export const Literal = <T>(value: T) =>
  new Type<T>(JSON.stringify(value), (v): v is T => v === value);

export const ArrayOf = <T>(elementType: Type<T>) =>
  new Type<T[]>(
    (elementType.typeName.indexOf(' ') !== -1
      ? '(' + elementType.typeName + ')'
      : elementType.typeName) + '[]',
    (v, context): v is Array<T> =>
      Array.isArray(v) && v.every(v => elementType._validate(v, context)),
  );

export const ObjectKeys = <T extends string>(keys: T[]) =>
  new Type<Record<T, {}>>(
    '{' + keys.join(', ') + '}',
    (v, context): v is Record<T, {}> => {
      if (!(v && typeof v === 'object')) {
        return false;
      }
      Object.keys(v).forEach(key => {
        if (keys.indexOf(key as T) === -1) {
          const suggestion = suggestMatch(keys, key);
          throw new Error(`Invalid key "${key}" in ${context}${suggestion}`);
        }
      });
      return true;
    },
  );
export const AnyObject = new Type<
  Record<string, {}>
>('Object', (v): v is Record<string, {}> => {
  return v && typeof v === 'object' && !Array.isArray(v);
});
