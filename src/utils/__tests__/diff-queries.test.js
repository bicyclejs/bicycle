import freeze from 'bicycle/utils/freeze';
import diffQueries from 'bicycle/utils/diff-queries';

test('returns undefined when there is no difference', () => {
  expect(diffQueries(freeze({}), freeze({}))).toBe(undefined);
  expect(diffQueries(freeze({foo: true}), freeze({foo: true}))).toBe(undefined);
  expect(diffQueries(freeze({foo: {bar: true}}), freeze({foo: {bar: true}}))).toBe(undefined);
  // underscore prefixed properties are ignored by diff-queries
  expect(diffQueries(freeze({foo: true, _bar: true}), freeze({foo: true}))).toBe(undefined);
  expect(diffQueries(freeze({foo: true}), freeze({foo: true, _bar: true}))).toBe(undefined);
});
test('returns the correct diff when there is a difference', () => {
  expect(diffQueries(freeze({foo: true}), freeze({}))).toEqual({foo: false});
  expect(diffQueries(freeze({}), freeze({foo: true}))).toEqual({foo: true});
  expect(diffQueries(freeze({foo: {bar: true}}), freeze({foo: {}}))).toEqual({foo: {bar: false}});
  expect(diffQueries(freeze({foo: {}}), freeze({foo: {bar: true}}))).toEqual({foo: {bar: true}});
  expect(diffQueries(freeze({}), freeze({foo: {bar: true}}))).toEqual({foo: {bar: true}});
  expect(diffQueries(freeze({foo: {bar: true}}), freeze({}))).toEqual({foo: false});
});
