import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import diffQueries from 'bicycle/utils/diff-queries';


test('diff-queries.js', () => {
  test('returns undefined when there is no difference', () => {
    assert.strictEqual(diffQueries(freeze({}), freeze({})), undefined);
    assert.strictEqual(diffQueries(freeze({foo: true}), freeze({foo: true})), undefined);
    assert.strictEqual(diffQueries(freeze({foo: {bar: true}}), freeze({foo: {bar: true}})), undefined);
    // underscore prefixed properties are ignored by diff-queries
    assert.strictEqual(diffQueries(freeze({foo: true, _bar: true}), freeze({foo: true})), undefined);
    assert.strictEqual(diffQueries(freeze({foo: true}), freeze({foo: true, _bar: true})), undefined);
  });
  test('returns the correct diff when there is a difference', () => {
    assert.deepEqual(diffQueries(freeze({foo: true}), freeze({})), {foo: false});
    assert.deepEqual(diffQueries(freeze({}), freeze({foo: true})), {foo: true});
    assert.deepEqual(diffQueries(freeze({foo: {bar: true}}), freeze({foo: {}})), {foo: {bar: false}});
    assert.deepEqual(diffQueries(freeze({foo: {}}), freeze({foo: {bar: true}})), {foo: {bar: true}});
    assert.deepEqual(diffQueries(freeze({}), freeze({foo: {bar: true}})), {foo: {bar: true}});
    assert.deepEqual(diffQueries(freeze({foo: {bar: true}}), freeze({})), {foo: false});
  });
});
