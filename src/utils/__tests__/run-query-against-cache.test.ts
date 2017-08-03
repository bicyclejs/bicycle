import {createNodeID} from '../../types/NodeID';
import {createErrorResult} from '../../types/ErrorResult';
import freeze from '../freeze';
import runQueryAgainstCache from '../run-query-against-cache';

test('returns the result of running the query', () => {
  const cache = freeze({
    Item: {foo: {a: 10, b: 20}},
    Root: {root: {items: [createNodeID('Item', 'foo')]}},
  });
  expect(runQueryAgainstCache(cache, {items: {a: true, b: true}})).toEqual({
    result: {items: [{a: 10, b: 20}]},
    loaded: true,
    errors: [],
    errorDetails: [],
  });
});
test('returns partial result if still loading', () => {
  const errA = createErrorResult('A sample error');
  const errB = createErrorResult('A sample error');
  const cache = freeze({
    Item: {foo: {a: 10, b: errA, c: errB}},
    Root: {root: {items: [createNodeID('Item', 'foo')]}},
  });
  expect(
    runQueryAgainstCache(cache, {
      items: {a: true, b: true, c: true},
    }),
  ).toEqual({
    result: {items: [{a: 10, b: errA, c: errB}]},
    loaded: true,
    errors: [errA.message],
    errorDetails: [errA, errB],
  });
});
