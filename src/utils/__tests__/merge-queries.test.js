import freeze from 'bicycle/utils/freeze';
import mergeQueries from 'bicycle/utils/merge-queries';

test('returns the correct diff when there is a difference', () => {
  expect(mergeQueries(freeze({foo: true}), freeze({foo: false}))).toEqual({});
  expect(mergeQueries(freeze({}), freeze({foo: true}))).toEqual({foo: true});
  expect(mergeQueries(freeze({foo: {bar: true}}), freeze({foo: {bar: false}}))).toEqual({foo: {}});
  expect(mergeQueries(freeze({foo: {}}), freeze({foo: {bar: true}}))).toEqual({foo: {bar: true}});
  expect(mergeQueries(freeze({}), freeze({foo: {bar: true}}))).toEqual({foo: {bar: true}});
  expect(mergeQueries(freeze({foo: {bar: true}}), freeze({foo: false}))).toEqual({});
});
