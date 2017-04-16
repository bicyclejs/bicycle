// @flow

import freeze from '../freeze';
import runQueryAgainstCache from '../run-query-against-cache';
import {ERROR} from '../../constants';

test('returns the result of running the query', () => {
  const cache = freeze({foo: {a: 10, b: 20}, root: {items: ['foo']}});
  expect(
    runQueryAgainstCache(
      cache,
      cache.root,
      {items: {a: true, b: true}},
    ),
  ).toEqual(
    {
      result: {items: [{a: 10, b: 20}]},
      loaded: true,
      errors: [],
      errorDetails: [],
    },
  );
});
test('returns partial result if still loading', () => {
  const errA = {_type: 'ERROR', value: 'A sample error'};
  const errB = {_type: 'ERROR', value: 'A sample error'};
  const cache = freeze({foo: {a: 10, b: errA, c: errB}, root: {items: ['foo']}});
  expect(
    runQueryAgainstCache(
      cache,
      cache.root,
      {items: {a: true, b: true, c: true}},
    ),
  ).toEqual(
    {
      result: {items: [{a: 10, b: errA, c: errB}]},
      loaded: true,
      errors: [errA.value],
      errorDetails: [errA, errB],
    },
  );
});
