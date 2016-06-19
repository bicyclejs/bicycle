// @public

import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {runQuery, runMutation} from './runner';
import handleMessage from './message-handler';

export {
  // (s: {objects: [], scalars: []}) => Schema
  loadSchema,
  // (dirname: string) => Schema
  loadSchemaFromFiles,
  // (schema: Schema, query: Object, context: Object) => Promise<Object>
  runQuery,
  // (schema: Schema, mutation: {name: string, args: Object}, context: Object) => Promise
  runMutation,
  // (schema: Object, sessionStore: SessionStore, message: Message, context: Object) => Promise<Result>
  handleMessage,
};
