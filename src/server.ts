import IContext from './types/IContext';
import BicycleServerCore, {Options} from './server-core';
import loadSchema, {loadSchemaFromFiles} from './load-schema';

export {Options};
export default class BicycleServer<
  Context extends IContext
> extends BicycleServerCore<Context> {
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
