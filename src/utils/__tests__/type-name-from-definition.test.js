import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-definition';

test('NamedTypeReference', () => {
  expect(typeName(freeze({kind: 'NamedTypeReference', value: 'MyType'}))).toBe('MyType?');
  expect(
    typeName(freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}})),
  ).toBe(
    'MyType'
  );
});
test('Array<NamedTypeReference>', () => {
  expect(
    typeName(freeze({kind: 'List', type: {kind: 'NamedTypeReference', value: 'MyType'}})),
  ).toBe(
    'Array<MyType?>?',
  );
  expect(
    typeName(freeze({kind: 'NotNull', type: {kind: 'List', type: {kind: 'NamedTypeReference', value: 'MyType'}}})),
  ).toBe(
    'Array<MyType?>',
  );
  expect(
    typeName(freeze({
      kind: 'NotNull',
      type: {kind: 'List', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}},
    })),
  ).toBe(
    'Array<MyType>',
  );
  expect(typeName({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}})).toBe('MyType');
});
