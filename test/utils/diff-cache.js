import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import diffCache from 'bicycle/utils/diff-cache';
import {DELETE_FIELD} from 'bicycle/constants';


test('diff-cache.js', () => {
  test('returns undefined when there is no difference', () => {
    assert.strictEqual(diffCache(freeze({}), freeze({})), undefined);
    assert.strictEqual(diffCache(freeze({foo: 10}), freeze({foo: 10})), undefined);
    assert.strictEqual(diffCache(freeze({foo: {bar: 10}}), freeze({foo: {bar: 10}})), undefined);
    assert.strictEqual(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 3]})), undefined);
    assert.strictEqual(diffCache(freeze({foo: null}), freeze({foo: null})), undefined);
  });
  test('returns the correct diff when there is a difference', () => {
    assert.deepEqual(diffCache(freeze({foo: 10}), freeze({})), {foo: {_type: DELETE_FIELD}});
    assert.deepEqual(diffCache(freeze({}), freeze({foo: 10})), {foo: 10});
    assert.deepEqual(diffCache(freeze({foo: {bar: 10}}), freeze({foo: {}})), {foo: {bar: {_type: DELETE_FIELD}}});
    assert.deepEqual(diffCache(freeze({foo: {}}), freeze({foo: {bar: 10}})), {foo: {bar: 10}});
    assert.deepEqual(diffCache(freeze({}), freeze({foo: {bar: 10}})), {foo: {bar: 10}});
    assert.deepEqual(diffCache(freeze({foo: {bar: 10}}), freeze({})), {foo: {_type: DELETE_FIELD}});
    assert.deepEqual(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]})), {foo: [1, 2, 4]});
    assert.deepEqual(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]})), {foo: [1, 2]});
    assert.deepEqual(diffCache(freeze({foo: null}), freeze({foo: undefined})), {foo: {_type: DELETE_FIELD}});
    assert.deepEqual(diffCache(freeze({}), freeze({foo: null})), {foo: null});
  });
});
