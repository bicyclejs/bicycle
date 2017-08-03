// @flow

import freeze from '../freeze';
import diffCache from '../diff-cache';
import {createDeleteField} from '../../types/DeleteField';

test('returns undefined when there is no difference', () => {
  expect(diffCache(freeze({}), freeze({}))).toBe(undefined);
  expect(
    diffCache(
      freeze({Item: {foo: {bar: 10}}}),
      freeze({Item: {foo: {bar: 10}}}),
    ),
  ).toBe(undefined);
  expect(
    diffCache(
      freeze({Item: {foo: {bar: [1, 2, 3]}}}),
      freeze({Item: {foo: {bar: [1, 2, 3]}}}),
    ),
  ).toBe(undefined);
});
test('returns the correct diff when there is a difference', () => {
  expect(diffCache(freeze({Item: {foo: {bar: 10}}}), freeze({}))).toEqual({
    Item: createDeleteField(),
  });
  expect(diffCache(freeze({}), freeze({Item: {foo: {bar: 10}}}))).toEqual({
    Item: {foo: {bar: 10}},
  });
  expect(
    diffCache(freeze({Item: {foo: {bar: 10}}}), freeze({Item: {foo: {}}})),
  ).toEqual({
    Item: {foo: {bar: createDeleteField()}},
  });
  expect(
    diffCache(freeze({Item: {foo: {}}}), freeze({Item: {foo: {bar: 10}}})),
  ).toEqual({Item: {foo: {bar: 10}}});
});
