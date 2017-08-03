import SchemaKind from './SchemaKind';

export interface LocationInfo {
  fileName: string;
  line: number;
}

export function isPrimativeType(
  valueType: ValueType,
): valueType is PrimativeType {
  return (
    valueType.kind === SchemaKind.Boolean ||
    valueType.kind === SchemaKind.Number ||
    valueType.kind === SchemaKind.String ||
    valueType.kind === SchemaKind.Void ||
    valueType.kind === SchemaKind.Null
  );
}

export interface PrimativeType {
  kind:
    | SchemaKind.Boolean
    | SchemaKind.Number
    | SchemaKind.String
    | SchemaKind.Void
    | SchemaKind.Null;
  loc?: LocationInfo;
  _hasNamedType?: boolean;
}

export interface ListType {
  kind: SchemaKind.List;
  loc?: LocationInfo;
  element: ValueType;
  _hasNamedType?: boolean;
}
export interface LiteralType {
  kind: SchemaKind.Literal;
  loc?: LocationInfo;
  value: boolean | number | string;
  _hasNamedType?: boolean;
}
export interface UnionType {
  kind: SchemaKind.Union;
  loc?: LocationInfo;
  elements: ValueType[];
  _hasNamedType?: boolean;
}
export interface ObjectType {
  kind: SchemaKind.Object;
  loc?: LocationInfo;
  properties: {
    [key: string]: ValueType;
  };
  _hasNamedType?: boolean;
}
export interface PromiseType {
  kind: SchemaKind.Promise;
  loc?: LocationInfo;
  result: ValueType;
  _hasNamedType?: boolean;
}

export interface NamedType {
  kind: SchemaKind.Named;
  loc?: LocationInfo;
  name: string;
  _hasNamedType?: boolean;
}

export type ValueType =
  | PrimativeType
  | ListType
  | LiteralType
  | UnionType
  | ObjectType
  | PromiseType
  | NamedType;

export default ValueType;
