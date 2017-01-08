// @flow
/* global NetworkLayerInterface */

import type PromisePolyfill from 'promise';

export type SessionID = string;

export type ErrorInterface = {
  message: string;
  stack: string;
  code: ?string;
  data: ?Object;
  exposeProd: ?boolean;
  mutation: ?{method: string, args: Object};
  query: ?Object;
  errors: ?Array<Error>;
  result: ?Object;
}

export type Query = {
  [key: string]: true | Query,
};

export type SessionStore = (
  {
    getSessionID(): PromisePolyfill<string> | Promise<string> | string,

    getCache(sessionId: SessionID): PromisePolyfill<Object> | Promise<Object>,
    setCache(sessionId: SessionID, data: Object): PromisePolyfill<any> | Promise<any>,
    getQuery(sessionId: SessionID): PromisePolyfill<?Query> | Promise<?Query>,
    setQuery(sessionId: SessionID, query: Query): PromisePolyfill<any> | Promise<any>,
  } |
  {
    getCache(sessionId: SessionID): PromisePolyfill<Object> | Promise<Object>,
    setCache(sessionId: SessionID, data: Object): PromisePolyfill<any> | Promise<any>,
    getQuery(sessionId: SessionID): PromisePolyfill<?Query> | Promise<?Query>,
    setQuery(sessionId: SessionID, query: Query): PromisePolyfill<any> | Promise<any>,
  }
);

export type ServerPreparation = {
  s: SessionID,
  q: Query,
  c: Object, // cache
};

export type ErrorResult = {
  _type: 'ERROR',
  value: string,
  data: any,
  code: ?string,
};

export type MutationResult = true | {s: boolean, v: any};

export type ServerResponse = {
  s?: SessionID, // undefined if expired
  d?: Object, // cache update
  m?: Array<MutationResult>,
};
export type ClientRequest = {
  s?: SessionID, // undefined if requesing a new session
  q?: Query, // query update
  m?: Array<{m: string, a: Object}>,
};

declare interface NetworkLayerInterface {
  send(message: ClientRequest): PromisePolyfill<ServerResponse> | Promise<ServerResponse>;
}
export type {NetworkLayerInterface};

export type TypeDefinition = (
  {kind: 'NotNull', type: TypeDefinition} |
  {kind: 'List', type: TypeDefinition} |
  {kind: 'NamedTypeReference', value: string} |
  {kind: 'ObjectScalar', properties: {[key: string]: TypeDefinition}}
);

export type ScalarType = {
  kind: 'ScalarType',
  name: string,
  description: ?string,
  // serialize into something JSONable for a response
  serialize: (value: mixed) => any,
  // parse from a JSON value
  parse: (value: mixed) => any,
};

export type ArgType = {
  kind: 'arg',
  type: TypeDefinition,
};
export type Context = Object;
export type FieldType = {
  type: TypeDefinition,
  args?: {[key: string]: ArgType},
  resolve?: (obj: Object, args: Object, context: Context, fieldContext: {type: string, name: string}) => any,
};
export type MutationType = {
  type?: TypeDefinition,
  args?: {[key: string]: ArgType},
  resolve: (args: Object, context: Context, mutationContext: {type: string, name: string}) => any,
};
export type SetMutation = (
  (
    args: {id: string | number, field: string, value: any},
    context: Context,
    mutationContext: {type: string, name: string},
  ) => mixed
);
export type MutationsType = {
  set?: SetMutation,
  [key: string]: MutationType,
};
export type ObjectType = {
  kind: 'NodeType',
  name: string,
  id: (obj: any) => string,
  description: ?string,
  fields: {[fieldName: string]: FieldType},
  mutations: Object,
};

export type Schema = {
  Root: ObjectType,
  [key: string]: ObjectType | ScalarType,
};
