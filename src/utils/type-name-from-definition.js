// @flow

import type {TypeDefinition} from '../flow-types';

function typeStringNotNull(type: TypeDefinition): string {
  switch (type.kind) {
    case 'List':
      return 'Array<' + typeString(type.type) + '>';
    case 'NamedTypeReference':
      return type.value;
    case 'ObjectScalar':
      const properties = type.properties;
      return (
        '{' + Object.keys(properties).map(name => name + ': ' + typeString(properties[name])).join(', ') + '}'
      );
    default:
      return 'UnknownType';
  }
}

export default function typeString(type: TypeDefinition): string {
  if (type.kind === 'NotNull') {
    return typeStringNotNull(type.type);
  } else {
    return typeStringNotNull(type) + '?';
  }
}
