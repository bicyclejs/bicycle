import IContext from './IContext';
import Logging from './Logging';
import Schema from './Schema';

export default interface MutationContext<Context extends IContext> {
  schema: Schema<Context>;
  logging: Logging;
  context: Context;
};
