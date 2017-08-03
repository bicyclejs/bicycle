// @flow

import freeze from '../freeze';
import mergeQueries from '../merge-queries';

test('merges queries and removes " as whatever" from the end', () => {
  expect(mergeQueries(freeze({foo: true}), freeze({foo: false}))).toEqual({});
  expect(mergeQueries(freeze({}), freeze({foo: true}))).toEqual({foo: true});
  expect(
    mergeQueries(freeze({foo: {bar: true}}), freeze({foo: {bar: false}})),
  ).toEqual({foo: {}});
  expect(mergeQueries(freeze({foo: {}}), freeze({foo: {bar: true}}))).toEqual({
    foo: {bar: true},
  });
  expect(mergeQueries(freeze({}), freeze({foo: {bar: true}}))).toEqual({
    foo: {bar: true},
  });
  expect(
    mergeQueries(freeze({foo: {bar: true}}), freeze({foo: false})),
  ).toEqual({});
  expect(
    mergeQueries(
      freeze({'foo as bar': {bar: true}}),
      freeze({'foo as thingy': {bing: true}}),
    ),
  ).toEqual({foo: {bar: true, bing: true}});
});
