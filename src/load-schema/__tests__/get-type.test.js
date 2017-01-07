import getType from 'bicycle/load-schema/get-type';

test('NamedTypeReference', () => {
  expect(
    getType('String?', 'context', ['String']),
  ).toEqual(
    {
      kind: 'NamedTypeReference',
      value: 'String',
    },
  );
  expect(
    getType('String', 'context', ['String']),
  ).toEqual(
    {
      kind: 'NotNull',
      type: {
        kind: 'NamedTypeReference',
        value: 'String',
      },
    },
  );
});
test('List', () => {
  expect(
    getType('String?[]?', 'context', ['String']),
  ).toEqual(
    {
      kind: 'List',
      type: {
        kind: 'NamedTypeReference',
        value: 'String',
      },
    },
  );
  expect(
    getType('String[]', 'context', ['String']),
  ).toEqual(
    {
      kind: 'NotNull',
      type: {
        kind: 'List',
        type: {
          kind: 'NotNull',
          type: {
            kind: 'NamedTypeReference',
            value: 'String',
          },
        },
      },
    },
  );
});
test('Throw on unexpected characters', () => {
  expect(
    () => getType('my_fake_type'),
  ).toThrowError(
    /Expected type name to match \[A-Za-z0-9\]\+ but got 'my_fake_type'/,
  );
});
test('A missing name', () => {
  expect(
    () => getType('MyType', 'context', []),
  ).toThrowError(
    /context refers to MyType, but there is no type by that name/,
  );
  expect(
    () => getType('MyTipe', 'context', ['MyType']),
  ).toThrowError(
    /context refers to MyTipe, but there is no type by that name maybe you meant to use "MyType"/,
  );
});
