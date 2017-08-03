// @flow

import freeze from '../freeze';
import typeName from '../type-name-from-definition';
import SchemaKind from '../../types/SchemaKind';

test('NamedTypeReference', () => {
  expect(
    typeName(
      freeze({kind: SchemaKind.Named as SchemaKind.Named, name: 'MyType'}),
    ),
  ).toBe('MyType');
});
test('Array<NamedTypeReference>', () => {
  expect(
    typeName(
      freeze({
        kind: SchemaKind.List as SchemaKind.List,
        element: {kind: SchemaKind.Named as SchemaKind.Named, name: 'MyType'},
      }),
    ),
  ).toBe('MyType[]');
});
