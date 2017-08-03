// @flow

import freeze from '../freeze';
import diffQueries from '../diff-queries';
import Query from '../../types/Query';

test('returns undefined when there is no difference', () => {
  expect(diffQueries(freeze({}), freeze({}))).toBe(undefined);
  expect(
    diffQueries(freeze<Query>({foo: true}), freeze<Query>({foo: true})),
  ).toBe(undefined);
  expect(
    diffQueries(
      freeze<Query>({foo: {bar: true}}),
      freeze<Query>({foo: {bar: true}}),
    ),
  ).toBe(undefined);
  // underscore prefixed properties are ignored by diff-queries
  expect(
    diffQueries(
      freeze<Query>({foo: true, _bar: true}),
      freeze<Query>({foo: true}),
    ),
  ).toBe(undefined);
  expect(
    diffQueries(
      freeze<Query>({foo: true}),
      freeze<Query>({foo: true, _bar: true}),
    ),
  ).toBe(undefined);
});
test('returns the correct diff when there is a difference', () => {
  expect(diffQueries(freeze<Query>({foo: true}), freeze<Query>({}))).toEqual({
    foo: false,
  });
  expect(diffQueries(freeze<Query>({}), freeze<Query>({foo: true}))).toEqual({
    foo: true,
  });
  expect(
    diffQueries(freeze<Query>({foo: {bar: true}}), freeze<Query>({foo: {}})),
  ).toEqual({
    foo: {bar: false},
  });
  expect(
    diffQueries(freeze<Query>({foo: {}}), freeze<Query>({foo: {bar: true}})),
  ).toEqual({
    foo: {bar: true},
  });
  expect(
    diffQueries(freeze<Query>({}), freeze<Query>({foo: {bar: true}})),
  ).toEqual({
    foo: {bar: true},
  });
  expect(
    diffQueries(freeze<Query>({foo: {bar: true}}), freeze<Query>({})),
  ).toEqual({
    foo: false,
  });
});
