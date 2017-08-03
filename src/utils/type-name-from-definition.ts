import {inspect} from 'util';
import SchemaKind from '../types/SchemaKind';
import ValueType from '../types/ValueType';

export default function typeNameFromDefinition(type: ValueType): string {
  switch (type.kind) {
    case SchemaKind.Boolean:
      return 'boolean';
    case SchemaKind.List:
      const needsBrackets = type.element.kind === SchemaKind.Union;
      return (
        (needsBrackets ? '(' : '') +
        typeNameFromDefinition(type.element) +
        (needsBrackets ? ')' : '') +
        '[]'
      );
    case SchemaKind.Literal:
      return inspect(type.value);
    case SchemaKind.Named:
      return type.name;
    case SchemaKind.Null:
      return 'null';
    case SchemaKind.Number:
      return 'number';
    case SchemaKind.Object:
      return (
        '{' +
        Object.keys(type.properties)
          .sort()
          .map(p => p + ': ' + typeNameFromDefinition(type.properties[p]))
          .join(', ') +
        '}'
      );
    case SchemaKind.Promise:
      return 'Promise<' + typeNameFromDefinition(type.result) + '>';
    case SchemaKind.String:
      return 'string';
    case SchemaKind.Union:
      return type.elements
        .map(e => typeNameFromDefinition(e))
        .sort()
        .join(' | ');
    case SchemaKind.Void:
      return 'void';
  }
}
