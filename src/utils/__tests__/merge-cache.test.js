import freeze from 'bicycle/utils/freeze';
import mergeCache from 'bicycle/utils/merge-cache';
import {DELETE_FIELD, ERROR} from 'bicycle/constants';

test('merges changes and returns a new object', () => {
  expect(mergeCache(freeze({foo: 10}), freeze({foo: {_type: DELETE_FIELD}}))).toEqual({});
  expect(mergeCache(freeze({}), freeze({foo: 10}))).toEqual({foo: 10});
  expect(mergeCache(freeze({foo: {bar: 10}}), freeze({foo: {bar: {_type: DELETE_FIELD}}}))).toEqual({foo: {}});
  expect(mergeCache(freeze({foo: {}}), freeze({foo: {bar: 10}}))).toEqual({foo: {bar: 10}});
  expect(mergeCache(freeze({}), freeze({foo: {bar: 10}}))).toEqual({foo: {bar: 10}});
  expect(mergeCache(freeze({foo: {bar: 10}}), freeze({foo: {_type: DELETE_FIELD}}))).toEqual({});
  expect(mergeCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]}))).toEqual({foo: [1, 2, 4]});
  expect(mergeCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]}))).toEqual({foo: [1, 2]});
  expect(mergeCache(freeze({}), freeze({foo: null}))).toEqual({foo: null});
  const e = {_type: ERROR, msg: 'foo'};
  expect(mergeCache(freeze({foo: {whatever: 10}}), freeze({foo: e})).foo).toBe(e);
});
