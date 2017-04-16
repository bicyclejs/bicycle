// @flow

import validateArg from '../arg-validator';
import freeze from '../../utils/freeze';

const DEFAULT_ROOT = {
  kind: 'NodeType',
  name: 'Root',
  description: undefined,
  id: () => 'root',
  fields: {},
  mutations: {},
};

test('NotNull', () => {
  const schema = freeze({
    Root: DEFAULT_ROOT,
    MyType: {
      kind: 'ScalarType',
      name: 'MyType',
      description: undefined,
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
        Root: DEFAULT_ROOT,
        MyType: {
          kind: 'ScalarType',
          name: 'MyType',
          description: undefined,
          parse(value) {
            throw new Error('whatever');
          },
          serialize() {
            throw new Error('Not implemented');
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
        Root: DEFAULT_ROOT,
        MyType: {
          kind: 'ScalarType',
          name: 'MyType',
          description: undefined,
          parse(value) {
            throw new Error('whatever');
          },
          serialize() {
            throw new Error('Not implemented');
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
      freeze({Root: DEFAULT_ROOT}),
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
            throw new Error('Not implemented');
          },
        },
      }),
      freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'Something'}}),
      freeze(1),
      'foo',
    ),
  ).toBe(-1);
});
