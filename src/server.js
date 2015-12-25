import loadSchema from './load-schema';
import middleware from './middleware';

export default function (rawSchema, rootValue) {
  return middleware(loadSchema(rawSchema), rawSchema, rootValue);
}
