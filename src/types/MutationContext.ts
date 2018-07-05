import Logging from './Logging';
import Schema from './Schema';

export default interface MutationContext<Context> {
  schema: Schema<Context>;
  logging: Logging;
  context: Context;
}
