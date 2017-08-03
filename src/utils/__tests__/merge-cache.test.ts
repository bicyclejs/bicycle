import freeze from '../freeze';
import mergeCache from '../merge-cache';
import {createDeleteField} from '../../types/DeleteField';
import {createErrorResult} from '../../types/ErrorResult';

test('merges changes and returns a new object', () => {
  expect(
    mergeCache(
      freeze({Item: {foo: {foo: 10}}}),
      freeze({Item: createDeleteField()}),
    ),
  ).toEqual({});
  expect(mergeCache(freeze({}), freeze({Item: {foo: {foo: 10}}}))).toEqual({
    Item: {foo: {foo: 10}},
  });
  expect(
    mergeCache(
      freeze({Item: {foo: {bar: 10}}}),
      freeze({Item: {foo: {bar: createDeleteField()}}}),
    ),
  ).toEqual({Item: {foo: {}}});
  expect(
    mergeCache(freeze({Item: {foo: {}}}), freeze({Item: {foo: {bar: 10}}})),
  ).toEqual({
    Item: {foo: {bar: 10}},
  });
  expect(mergeCache(freeze({}), freeze({Item: {foo: {bar: 10}}}))).toEqual({
    Item: {foo: {bar: 10}},
  });
  expect(
    mergeCache(
      freeze({Item: {foo: {bar: 10}}}),
      freeze({Item: {foo: createDeleteField()}}),
    ),
  ).toEqual({Item: {}});
  expect(
    mergeCache(
      freeze({Item: {foo: {bar: [1, 2, 3]}}}),
      freeze({Item: {foo: {bar: [1, 2, 4]}}}),
    ),
  ).toEqual({Item: {foo: {bar: [1, 2, 4]}}});
  expect(
    mergeCache(
      freeze({Item: {foo: {bar: [1, 2, 3]}}}),
      freeze({Item: {foo: {bar: [1, 2]}}}),
    ),
  ).toEqual({
    Item: {foo: {bar: [1, 2]}},
  });
  expect(mergeCache(freeze({}), freeze({Item: {foo: {bar: null}}}))).toEqual({
    Item: {foo: {bar: null}},
  });
  const e = createErrorResult('Some Error');
  expect(
    (mergeCache(
      freeze({Item: {foo: {whatever: 10}}}),
      freeze({Item: {foo: {whatever: e}}}),
    ) as any).Item.foo.whatever,
  ).toBe(e);
});
