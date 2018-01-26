// @flow

import freeze from '../freeze';
import diffCache from '../diff-cache';

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
  expect(
    diffCache(
      freeze({Item: {foo: {bar: [{foo: 10}]}}}),
      freeze({Item: {foo: {bar: [{foo: 10}]}}}),
    ),
  ).toBe(undefined);
});
test('removing items does not count as a "difference"', () => {
  expect(diffCache(freeze({Item: {foo: {bar: 10}}}), freeze({}))).toEqual(
    undefined,
  );
  expect(
    diffCache(freeze({Item: {foo: {bar: 10}}}), freeze({Item: {foo: {}}})),
  ).toEqual(undefined);
});
test('returns the correct diff when there is a difference', () => {
  expect(diffCache(freeze({}), freeze({Item: {foo: {bar: 10}}}))).toEqual({
    Item: {foo: {bar: 10}},
  });
  expect(
    diffCache(freeze({Item: {foo: {}}}), freeze({Item: {foo: {bar: 10}}})),
  ).toEqual({Item: {foo: {bar: 10}}});
});
