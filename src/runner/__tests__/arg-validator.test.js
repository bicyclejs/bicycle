import validateArg from 'bicycle/runner/arg-validator';
import freeze from 'bicycle/utils/freeze';

test('NotNull', () => {
  const schema = freeze({
    MyType: {
      kind: 'ScalarType',
      name: 'MyType',
      parse(v) {
        return v;
      },
      serialize(v) {
        return v;
      },
    },
  });
  const type = freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}});
  validateArg(
    schema,
    type,
    'whatever',
    'my-arg'
  );
  expect(
    () => validateArg(
      schema,
      type,
      null,
      'my-arg'
    )
  ).toThrowError('Expected arg "my-arg" to be of type "MyType" but got null');
});
test('Short strings give actual value', () => {
  expect(
    () => validateArg(
      freeze({
        MyType: {
          kind: 'ScalarType',
          parse(value) {
            throw new Error('whatever');
          },
        },
      }),
      freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}),
      'some value',
      'my-arg'
    )
  ).toThrowError('Expected arg "my-arg" to be of type "MyType" but got \'some value\'');
});
test('Long strings give type name', () => {
  expect(
    () => validateArg(
      freeze({
        MyType: {
          kind: 'ScalarType',
          parse(value) {
            throw new Error('whatever');
          },
        },
      }),
      freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}),
      Array(5000).join('a'),
      'my-arg'
    )
  ).toThrowError('Expected arg "my-arg" to be of type "MyType" but got a "string"');
});
test('Errors if the type name is not recognised', () => {
  expect(
    () => validateArg(
      freeze({}),
      freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}),
      Array(5000).join('a'),
      'my-arg'
    )
  ).toThrowError('Expected arg "my-arg" to be of type "MyType" but got a "string"');
});

test('parses a scalar arg arg', () => {
  expect(
    validateArg(
      freeze({
        Something: {
          kind: 'ScalarType',
          parse(value) {
            return value * -1;
          },
        },
      }),
      freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'Something'}}),
      freeze(1),
      'foo',
    ),
  ).toBe(-1);
});
