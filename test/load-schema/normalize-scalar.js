import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import normalizeScalar from 'bicycle/load-schema/normalize-scalar';

test('normalize-scalar.js', () => {
  test('no name throws', () => {
    assert.throws(
      () => normalizeScalar(freeze({})),
      /Expected Scalar\.name to be a string but got undefined/,
    );
  });
  test('name must be alphabetic characters', () => {
    assert.throws(
      () => normalizeScalar(freeze({name: 'something_else'})),
      /Expected Scalar\.name to match \[A-Za-z\]\+ but got 'something_else'/,
    );
  });
  test('description not a string throws', () => {
    assert.throws(
      () => normalizeScalar(freeze({name: 'Something', description: null})),
      /Expected Something\.description to be a string but got null/,
    );
  });
  test('no methods throws', () => {
    assert.throws(
      () => normalizeScalar(freeze({name: 'Something'})),
      /Something expected either a validate method or a serialize and parse method/,
    );
  });
  test('validate + parse/serialize throws', () => {
    assert.throws(
      () => normalizeScalar(freeze({name: 'Something', validate() {}, serialize() {}})),
      /Something has a validate method and serialize\/parse/,
    );
    assert.throws(
      () => normalizeScalar(freeze({name: 'Something', validate() {}, parse() {}})),
      /Something has a validate method and serialize\/parse/,
    );
  });
  test('.validate', () => {
    test('non-function validate throws', () => {
      assert.throws(
        () => normalizeScalar(freeze({name: 'Something', validate: 'not a function'})),
        /Expected Something\.validate to be a function but got string/,
      );
    });
    test('validates on serialize and parse', () => {
      const result = normalizeScalar(freeze({
        name: 'Something',
        validate: val => assert(val === 'Something', 'Expected val to be "Something"'),
      }));
      assert.strictEqual(result.kind, 'ScalarType');
      assert.strictEqual(result.name, 'Something');
      assert.strictEqual(result.parse('Something'), 'Something');
      assert.strictEqual(result.serialize('Something'), 'Something');
      assert.throws(
        () => result.parse('Something Else'),
        /Expected val to be "Something"/,
      );
      assert.throws(
        () => result.serialize('Something Else'),
        /Expected val to be "Something"/,
      );
    });
  });
  test('.parse and .serialize', () => {
    test('non-function serialize or parse throws', () => {
      assert.throws(
        () => normalizeScalar(freeze({name: 'Something', serialize: 'not a function', parse() {}})),
        /Expected Something\.serialize to be a function but got string/,
      );
      assert.throws(
        () => normalizeScalar(freeze({name: 'Something', serialize() {}, parse: 'not a function'})),
        /Expected Something\.parse to be a function but got string/,
      );
    });
    test('works with serialize and parse', () => {
      const result = normalizeScalar(freeze({
        name: 'Something',
        serialize: val => val + 1,
        parse: val => val - 1,
      }));
      assert.strictEqual(result.kind, 'ScalarType');
      assert.strictEqual(result.name, 'Something');
      assert.strictEqual(result.parse(0), -1);
      assert.strictEqual(result.serialize(0), 1);
    });
  });
});
