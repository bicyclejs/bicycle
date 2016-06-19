// @public

import loadSchema, {loadSchemaFromFiles} from './load-schema';
import {runQuery, runMutation} from './runner';
import handleMessage from './message-handler';
import createBicycleMiddleware from './server';
import createServerRenderer from './server-rendering';

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
  // (schema: Schema, sessionStore: SessionStore, getContext: (req) => Object) => Middleware
  createBicycleMiddleware,
  // (schema: Schema, sessionStore: SessionStore, fn: (client: Object, ...args) => Result) => (context: Object, ...args) => Result
  createServerRenderer,
};
