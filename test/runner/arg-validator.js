import assert from 'assert';
import test from 'testit';
import validateArg from 'bicycle/runner/arg-validator';
import freeze from 'bicycle/utils/freeze';


test('arg-validator.js', () => {
  test('NotNull', () => {
    try {
      validateArg(
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
      validateArg(
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
      validateArg(
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
  test('Errors if the type name is not recognised', () => {
    try {
      validateArg(
        freeze({}),
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
  test('parses a scalar arg arg', () => {
    assert.deepEqual(
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
      -1,
    );
  });
});
