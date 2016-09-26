import validateArgs from 'bicycle/runner/args-validator';
import freeze from 'bicycle/utils/freeze';

describe('extra arg', () => {
  test('suggests near matches', () => {
    expect(
      () => validateArgs(
        freeze({}),
        freeze({foo: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}}),
        freeze({boo: 'whatever'}),
      ),
    ).toThrowError('Unexpected argument "boo" maybe you meant to use "foo"');
  });
  test('does not suggest matches if there are no close matches', () => {
    expect(
      () => validateArgs(
        freeze({}),
        freeze({whatever: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}}),
        freeze({boo: 'whatever'})
      ),
    ).toThrowError('Unexpected argument "boo"');
  });
});
test('validates each arg', () => {
  const schema = freeze({
    Something: {
      kind: 'ScalarType',
      name: 'Something',
      parse(value) {
        return value * -1;
      },
      serialize(value) {
        return value * -1;
      },
    },
  });
  expect(
    validateArgs(
      schema,
      freeze({foo: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'Something'}}}}),
      freeze({foo: 1})
    ),
  ).toEqual({foo: -1});
  expect(
    () => {
      validateArgs(
        schema,
        freeze({foo: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'Something'}}}}),
        freeze({foo: undefined})
      );
    },
  ).toThrowError('Expected arg "foo" to be of type "Something" but got undefined');
});
