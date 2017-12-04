import Cache from './Cache';
import IContext from './IContext';
import Logging from './Logging';
import Schema from './Schema';

export default interface QueryContext<Context extends IContext> {
  schema: Schema<Context>;
  context: Context;
  result: Cache;
  logging: Logging;
  /**
   * This represents a normalised record of which fields are already being
   * queried, so that everything is only queried once.  e.g. for a query like:
   *
   * {foo: {a: true, b: {c: true, d: true}}, bar: {a: true, b: {c: true, d: true}}}
   *
   * if `foo` and `bar` refer to an object with the same `ObjectID` we will only resolve all
   * the fields within that object once.
   */
  startedQueries: NormalizedQuery;
};

export interface MutableQuery {
  [key: string]: true | MutableQuery;
}
export interface NodeQueries {
  [id: string]: void | MutableQuery;
}
export interface NormalizedQuery {
  [nodeName: string]: void | NodeQueries;
}
