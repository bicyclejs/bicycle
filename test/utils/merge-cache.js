import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import mergeCache from 'bicycle/utils/merge-cache';
import {DELETE_FIELD} from 'bicycle/constants';


test('merge-cache.js', () => {
  test('merges changes and returns a new object', () => {
    assert.deepEqual(mergeCache(freeze({foo: 10}), freeze({foo: {_type: DELETE_FIELD}})), {});
    assert.deepEqual(mergeCache(freeze({}), freeze({foo: 10})), {foo: 10});
    assert.deepEqual(mergeCache(freeze({foo: {bar: 10}}), freeze({foo: {bar: {_type: DELETE_FIELD}}})), {foo: {}});
    assert.deepEqual(mergeCache(freeze({foo: {}}), freeze({foo: {bar: 10}})), {foo: {bar: 10}});
    assert.deepEqual(mergeCache(freeze({}), freeze({foo: {bar: 10}})), {foo: {bar: 10}});
    assert.deepEqual(mergeCache(freeze({foo: {bar: 10}}), freeze({foo: {_type: DELETE_FIELD}})), {});
    assert.deepEqual(mergeCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]})), {foo: [1, 2, 4]});
    assert.deepEqual(mergeCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]})), {foo: [1, 2]});
    assert.deepEqual(mergeCache(freeze({}), freeze({foo: null})), {foo: null});
  });
});
