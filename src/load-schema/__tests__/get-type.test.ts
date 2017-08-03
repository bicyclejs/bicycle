import SchemaKind from '../../types/SchemaKind';
import getType from '../../load-schema/get-type';

test('NamedTypeReference', () => {
  expect(getType('String?', 'context', ['String'])).toEqual({
    kind: SchemaKind.Union,
    elements: [
      {
        kind: SchemaKind.Named,
        name: 'String',
      },
      {kind: SchemaKind.Null},
      {kind: SchemaKind.Void},
    ],
  });
  expect(getType('String', 'context', ['String'])).toEqual({
    kind: SchemaKind.Named,
    name: 'String',
  });
});
test('List', () => {
  expect(getType('String?[]?', 'context', ['String'])).toEqual({
    kind: SchemaKind.Union,
    elements: [
      {
        kind: SchemaKind.List,
        element: {
          kind: SchemaKind.Union,
          elements: [
            {
              kind: SchemaKind.Named,
              name: 'String',
            },
            {kind: SchemaKind.Null},
            {kind: SchemaKind.Void},
          ],
        },
      },
      {kind: SchemaKind.Null},
      {kind: SchemaKind.Void},
    ],
  });
  expect(getType('String[]', 'context', ['String'])).toEqual({
    kind: SchemaKind.List,
    element: {
      kind: SchemaKind.Named,
      name: 'String',
    },
  });
});
test('Throw on unexpected characters', () => {
  expect(() => getType('my_fake_type', 'context', [])).toThrowError(
    /Expected type name to match \[A-Za-z0-9\]\+ but got 'my_fake_type'/,
  );
});
test('A missing name', () => {
  expect(() => getType('MyType', 'context', [])).toThrowError(
    /context refers to MyType, but there is no type by that name/,
  );
  expect(() => getType('MyTipe', 'context', ['MyType'])).toThrowError(
    /context refers to MyTipe, but there is no type by that name maybe you meant to use "MyType"/,
  );
});
