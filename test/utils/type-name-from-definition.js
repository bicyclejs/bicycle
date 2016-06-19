import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-definition';

test('type-name-from-definition.js', () => {
  test('NamedTypeReference', () => {
    assert.strictEqual(typeName(freeze({kind: 'NamedTypeReference', value: 'MyType'})), 'MyType?');
    assert.strictEqual(
      typeName(freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}})),
      'MyType'
    );
  });
  test('Array<NamedTypeReference>', () => {
    assert.strictEqual(
      typeName(freeze({kind: 'List', type: {kind: 'NamedTypeReference', value: 'MyType'}})),
      'Array<MyType?>?',
    );
    assert.strictEqual(
      typeName(freeze({kind: 'NotNull', type: {kind: 'List', type: {kind: 'NamedTypeReference', value: 'MyType'}}})),
      'Array<MyType?>',
    );
    assert.strictEqual(
      typeName(freeze({
        kind: 'NotNull',
        type: {kind: 'List', type: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}},
      })),
      'Array<MyType>',
    );
    assert.strictEqual(typeName({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}), 'MyType');
  });
});
