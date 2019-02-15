import BicycleServerCore, {Options} from './server-core';
import loadSchema, {loadSchemaFromFiles} from './load-schema';

export {Options};

/**
 * BicycleServer provides methods for exposing your
 * schema over a network, and for directly querying
 * your schema on the server.
 *
 * @public
 */
class BicycleServer<Context> extends BicycleServerCore<Context> {
  constructor(
    schema: {objects: any[]; scalars?: any[]} | string,
    options: Options = {},
  ) {
    super(
      typeof schema === 'string'
        ? loadSchemaFromFiles(schema)
        : loadSchema(schema),
      options,
    );
  }
}

export default BicycleServer;
