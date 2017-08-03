import SchemaKind from '../types/SchemaKind';
import Schema from '../types/Schema';
import ValueType, {NamedType} from '../types/ValueType';

export default function matchesType(
  type: ValueType,
  value: any,
  schema: Schema<any>,
  allowNodes: boolean,
): boolean {
  switch (type.kind) {
    case SchemaKind.Boolean:
      return typeof value === 'boolean';
    case SchemaKind.List:
      return (
        Array.isArray(value) &&
        value.every(v => matchesType(type.element, v, schema, allowNodes))
      );
    case SchemaKind.Literal:
      return value === type.value;
    case SchemaKind.Null:
      return value === null;
    case SchemaKind.Number:
      return typeof value === 'number';
    case SchemaKind.Object:
      return (
        value &&
        typeof value === 'object' &&
        Object.keys(type.properties).every(p =>
          matchesType(type.properties[p], value[p], schema, allowNodes),
        ) &&
        Object.keys(value).every(p =>
          Object.prototype.hasOwnProperty.call(type.properties, p),
        )
      );
    case SchemaKind.String:
      return typeof value === 'string';
    case SchemaKind.Union:
      return type.elements.some(e => matchesType(e, value, schema, allowNodes));
    case SchemaKind.Void:
      return value === undefined;
    case SchemaKind.Any:
      return true;
    case SchemaKind.Promise:
      throw new Error('Promises are not supported in this location');
    case SchemaKind.Named:
      return matchesNamedType(type, value, schema, allowNodes);
  }
}
function matchesNamedType(
  type: NamedType,
  value: any,
  schema: Schema<any>,
  allowNodes: boolean,
): boolean {
  const t = schema[type.name];
  switch (t.kind) {
    case SchemaKind.NodeType:
      return allowNodes && t.matches(value) === true;
    case SchemaKind.Scalar:
      return (
        // never allow nodes in the base type
        matchesType(t.baseType, value, schema, false) &&
        t.validate(value) === true
      );
  }
}
