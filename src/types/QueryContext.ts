import Cache from './Cache';
import IContext from './IContext';
import Logging from './Logging';
import Schema from './Schema';

export default interface QueryContext<Context extends IContext> {
  schema: Schema<Context>;
  context: Context;
  result: Cache;
  logging: Logging;
};
