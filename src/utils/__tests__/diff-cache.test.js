import freeze from 'bicycle/utils/freeze';
import diffCache from 'bicycle/utils/diff-cache';
import {DELETE_FIELD} from 'bicycle/constants';

test('returns undefined when there is no difference', () => {
  expect(diffCache(freeze({}), freeze({}))).toBe(undefined);
  expect(diffCache(freeze({foo: 10}), freeze({foo: 10}))).toBe(undefined);
  expect(diffCache(freeze({foo: {bar: 10}}), freeze({foo: {bar: 10}}))).toBe(undefined);
  expect(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 3]}))).toBe(undefined);
  expect(diffCache(freeze({foo: null}), freeze({foo: null}))).toBe(undefined);
});
test('returns the correct diff when there is a difference', () => {
  expect(diffCache(freeze({foo: 10}), freeze({}))).toEqual({foo: {_type: DELETE_FIELD}});
  expect(diffCache(freeze({}), freeze({foo: 10}))).toEqual({foo: 10});
  expect(diffCache(freeze({foo: {bar: 10}}), freeze({foo: {}}))).toEqual({foo: {bar: {_type: DELETE_FIELD}}});
  expect(diffCache(freeze({foo: {}}), freeze({foo: {bar: 10}}))).toEqual({foo: {bar: 10}});
  expect(diffCache(freeze({}), freeze({foo: {bar: 10}}))).toEqual({foo: {bar: 10}});
  expect(diffCache(freeze({foo: {bar: 10}}), freeze({}))).toEqual({foo: {_type: DELETE_FIELD}});
  expect(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]}))).toEqual({foo: [1, 2, 4]});
  expect(diffCache(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]}))).toEqual({foo: [1, 2]});
  expect(diffCache(freeze({foo: null}), freeze({foo: undefined}))).toEqual({foo: {_type: DELETE_FIELD}});
  expect(diffCache(freeze({}), freeze({foo: null}))).toEqual({foo: null});
});
