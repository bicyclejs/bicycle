import getType from 'bicycle/load-schema/get-type';

test('NamedTypeReference', () => {
  expect(
    getType('String?'),
  ).toEqual(
    {
      kind: 'NamedTypeReference',
      value: 'String',
    },
  );
  expect(
    getType('String'),
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
    getType('String?[]?'),
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
    getType('String[]'),
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
