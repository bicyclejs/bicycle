// @flow

import freeze from '../freeze';
import notEqual from '../not-equal';

test('returns false when there is no difference', () => {
  expect(notEqual(freeze({}), freeze({}))).toBe(false);
  expect(notEqual(freeze({foo: 10}), freeze({foo: 10}))).toBe(false);
  expect(notEqual(freeze({foo: {bar: 10}}), freeze({foo: {bar: 10}}))).toBe(false);
  expect(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 3]}))).toBe(false);
  expect(notEqual(freeze({foo: null}), freeze({foo: null}))).toBe(false);
});
test('returns true when there is a difference', () => {
  expect(notEqual(freeze({foo: 10}), freeze({}))).toBe(true);
  expect(notEqual(freeze({}), freeze({foo: 10}))).toBe(true);
  expect(notEqual(freeze({foo: {bar: 10}}), freeze({foo: {}}))).toBe(true);
  expect(notEqual(freeze({foo: {}}), freeze({foo: {bar: 10}}))).toBe(true);
  expect(notEqual(freeze({}), freeze({foo: {bar: 10}}))).toBe(true);
  expect(notEqual(freeze({foo: {bar: 10}}), freeze({}))).toBe(true);
  expect(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2, 4]}))).toBe(true);
  expect(notEqual(freeze({foo: [1, 2, 3]}), freeze({foo: [1, 2]}))).toBe(true);
  expect(notEqual(freeze({foo: null}), freeze({foo: undefined}))).toBe(true);
  expect(notEqual(freeze({}), freeze({foo: null}))).toBe(true);
});
