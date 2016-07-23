import assert from 'assert';
import test from 'testit';
import validateArgs from 'bicycle/runner/args-validator';
import freeze from 'bicycle/utils/freeze';


test('args-validator.js', () => {
  test('extra arg', () => {
    test('suggests near matches', () => {
      try {
        validateArgs(
          freeze({}),
          freeze({foo: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}),
          freeze({boo: 'whatever'})
        );
      } catch (ex) {
        assert(ex instanceof TypeError);
        assert.strictEqual(ex.message, 'Unexpected argument "boo" maybe you meant to use "foo"');
        return;
      }
      throw new Error('Expected an error to be thrown');
    });
    test('does not suggest matches if there are no close matches', () => {
      try {
        validateArgs(
          freeze({}),
          freeze({whatever: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'MyType'}}}),
          freeze({boo: 'whatever'})
        );
      } catch (ex) {
        assert(ex instanceof TypeError);
        assert.strictEqual(ex.message, 'Unexpected argument "boo"');
        return;
      }
      throw new Error('Expected an error to be thrown');
    });
  });
  test('validates each arg', () => {
    const schema = freeze({
      Something: {
        kind: 'ScalarType',
        name: 'Something',
        parse(value) {
          console.dir(value);
          return value * -1;
        },
        serialize(value) {
          console.dir(value);
          return value * -1;
        },
      },
    });
    assert.deepEqual(
      validateArgs(
        freeze({
          Something: {
            kind: 'ScalarType',
            parse(value) {
              return value * -1;
            },
          },
        }),
        freeze({foo: {kind: 'NotNull', type: {kind: 'NamedTypeReference', value: 'Something'}}}),
        freeze({foo: 1})
      ),
      {foo: -1}
    );
  });
});
