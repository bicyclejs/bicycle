function typeStringNotNull(type: Object): string {
  switch (type.kind) {
    case 'List':
      return 'Array<' + typeString(type.type) + '>';
    case 'NamedTypeReference':
      return type.value;
    default:
      return 'UnknownType';
  }
}

export default function typeString(type: Object): string {
  if (type.kind === 'NotNull') {
    return typeStringNotNull(type.type);
  } else {
    return typeStringNotNull(type) + '?';
  }
}
