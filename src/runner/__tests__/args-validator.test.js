// @flow

import validateArgs from '../args-validator';
import freeze from '../../utils/freeze';

const DEFAULT_ROOT = {
  kind: 'NodeType',
  name: 'Root',
  description: undefined,
  id: () => 'root',
  fields: {},
  mutations: {},
};

describe('extra arg', () => {
  test('suggests near matches', () => {
    expect(
      () => validateArgs(
        freeze({Root: DEFAULT_ROOT}),
        freeze({foo: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}}),
        freeze({boo: 'whatever'}),
      ),
    ).toThrowError('Unexpected argument "boo" maybe you meant to use "foo"');
  });
  test('does not suggest matches if there are no close matches', () => {
    expect(
      () => validateArgs(
        freeze({Root: DEFAULT_ROOT}),
        freeze({whatever: {kind: 'arg', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}}),
        freeze({boo: 'whatever'})
      ),
    ).toThrowError('Unexpected argument "boo"');
  });
});
test('validates each arg', () => {
  const schema = freeze({
    Root: DEFAULT_ROOT,
    Something: {
      kind: 'ScalarType',
      name: 'Something',
      description: undefined,
      parse(value) {
        if (typeof value !== 'number') {
          throw new Error('Expected a number');
        }
        return value * -1;
      },
      serialize(value) {
        if (typeof value !== 'number') {
          throw new Error('Expected a number');
        }
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
