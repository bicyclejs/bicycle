import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import mergeQueries from 'bicycle/utils/merge-queries';


test('merge-queries.js', () => {
  test('returns the correct diff when there is a difference', () => {
    assert.deepEqual(mergeQueries(freeze({foo: true}), freeze({foo: false})), {});
    assert.deepEqual(mergeQueries(freeze({}), freeze({foo: true})), {foo: true});
    assert.deepEqual(mergeQueries(freeze({foo: {bar: true}}), freeze({foo: {bar: false}})), {foo: {}});
    assert.deepEqual(mergeQueries(freeze({foo: {}}), freeze({foo: {bar: true}})), {foo: {bar: true}});
    assert.deepEqual(mergeQueries(freeze({}), freeze({foo: {bar: true}})), {foo: {bar: true}});
    assert.deepEqual(mergeQueries(freeze({foo: {bar: true}}), freeze({foo: false})), {});
  });
});
