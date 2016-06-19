import assert from 'assert';
import test from 'testit';
import checkArgType from 'bicycle/runner/arg-validator';
import freeze from 'bicycle/utils/freeze';


test('args-validator.js', () => {
  test('NotNull', () => {
    try {
      checkArgType(
        freeze({}),
        freeze({kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}),
        null,
        'my-arg'
      );
    } catch (ex) {
      assert(ex instanceof TypeError);
      assert.strictEqual(ex.message, 'Expected arg "my-arg" to be of type "MyType" but got null');
      return;
    }
    throw new Error('Expected an error to be thrown');
  });
  test('Short strings give actual value', () => {
    try {
      checkArgType(
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
      );
    } catch (ex) {
      assert(ex instanceof TypeError);
      assert.strictEqual(ex.message, 'Expected arg "my-arg" to be of type "MyType" but got \'some value\'');
      return;
    }
    throw new Error('Expected an error to be thrown');
  });
  test('Long strings give type name', () => {
    try {
      checkArgType(
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
      );
    } catch (ex) {
      assert(ex instanceof TypeError);
      assert.strictEqual(ex.message, 'Expected arg "my-arg" to be of type "MyType" but got a "string"');
      return;
    }
    throw new Error('Expected an error to be thrown');
  });
});
