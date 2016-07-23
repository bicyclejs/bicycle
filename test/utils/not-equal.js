import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import notEqual from 'bicycle/utils/not-equal';


test('not-equal.js', () => {
  test('returns false when there is no difference', () => {
    assert.strictEqual(notEqual(freeze({}), freeze({})), false);
    assert.strictEqual(notEqual(freeze({foo: 10}), freeze({foo: 10})), false);
    assert.strictEqual(notEqual(freeze({foo: {bar: 10}}), freeze({foo: {bar: 10}})), false);
    assert.strictEqual(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 3]})), false);
    assert.strictEqual(notEqual(freeze({foo: null}), freeze({foo: null})), false);
  });
  test('returns true when there is a difference', () => {
    assert.strictEqual(notEqual(freeze({foo: 10}), freeze({})), true);
    assert.strictEqual(notEqual(freeze({}), freeze({foo: 10})), true);
    assert.strictEqual(notEqual(freeze({foo: {bar: 10}}), freeze({foo: {}})), true);
    assert.strictEqual(notEqual(freeze({foo: {}}), freeze({foo: {bar: 10}})), true);
    assert.strictEqual(notEqual(freeze({}), freeze({foo: {bar: 10}})), true);
    assert.strictEqual(notEqual(freeze({foo: {bar: 10}}), freeze({})), true);
    assert.strictEqual(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]})), true);
    assert.strictEqual(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]})), true);
    assert.strictEqual(notEqual(freeze({foo: null}), freeze({foo: undefined})), true);
    assert.strictEqual(notEqual(freeze({}), freeze({foo: null})), true);
  });
});
