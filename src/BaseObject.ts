/**
 * Base class for typed Bicycle Node Objects
 */
export default abstract class BaseObject<TData> {
  readonly [Symbol.toStringTag]: 'BicycleSchemaObject';
  static readonly [Symbol.toStringTag]: 'BicycleSchemaObject';

  /**
   * If you do not have an id property, you can set this to any field.
   * You can also just define a calculated field called `id`.
   */
  $id: string = 'id';
  $auth: {[key: string]: string[]} = {};
  static $auth: {[key: string]: string[]} = {};

  public readonly data: TData;
  constructor(data: TData) {
    this.data = data;
  }
}
