import Query from './Query';
import SchemaKind from './SchemaKind';
import ValueType from './ValueType';
import QueryContext from './QueryContext';
import MutationContext from './MutationContext';

export interface FieldMethod<Value, Arg, Result, Context> {
  kind: SchemaKind.FieldMethod;
  name: string;
  description: void | string;
  resultType: ValueType;
  argType: ValueType;
  auth:
    | 'public'
    | ((
        value: Value,
        arg: Arg,
        context: Context,
        subQuery: true | Query,
        qCtx: QueryContext<Context>,
      ) => boolean | PromiseLike<boolean>);
  resolve: (
    value: Value,
    arg: Arg,
    context: Context,
    subQuery: true | Query,
    qCtx: QueryContext<Context>,
  ) => Result | PromiseLike<Result>;
}
export interface FieldProperty<Value, Context> {
  kind: SchemaKind.FieldProperty;
  name: string;
  description: void | string;
  auth:
    | 'public'
    | ((
        value: Value,
        arg: void,
        context: Context,
        subQuery: true | Query,
        qCtx: QueryContext<Context>,
      ) => boolean | PromiseLike<boolean>);
  resultType: ValueType;
}
export type Field<Value, Arg, Result, Context> =
  | FieldProperty<Value, Context>
  | FieldMethod<Value, Arg, Result, Context>;

export interface Mutation<Arg, Result, Context> {
  kind: SchemaKind.Mutation;
  /**
   * The name for use in error messages, e.g. Account.create
   */
  name: string;
  description: void | string;
  resultType: ValueType;
  argType: ValueType;
  auth:
    | 'public'
    | ((
        arg: Arg,
        context: Context,
        mCtx: MutationContext<Context>,
      ) => boolean | PromiseLike<boolean>);
  resolve: (
    arg: Arg,
    context: Context,
    mCtx: MutationContext<Context>,
  ) => Result | PromiseLike<Result>;
}

export interface NodeType<Value, Context> {
  kind: SchemaKind.NodeType;
  name: string;
  description: void | string;
  id: (obj: any, ctx: Context, qCtx: QueryContext<Context>) => string;
  matches: (obj: any) => obj is Value;
  fields: {[fieldName: string]: Field<Value, any, any, Context>};
  mutations: {[mutationName: string]: Mutation<any, any, Context>};
}

export interface ScalarDeclaration<BaseType, TypeTag extends BaseType> {
  kind: SchemaKind.Scalar;
  name: string;
  description: void | string;
  baseType: ValueType;
  validate(value: BaseType): value is TypeTag;
}
type Schema<Context> = {
  Root: NodeType<{}, Context>;
  [key: string]: NodeType<any, Context> | ScalarDeclaration<any, any>;
};
export default Schema;
