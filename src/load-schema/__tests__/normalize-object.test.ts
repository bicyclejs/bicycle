import freeze from '../../utils/freeze';
import normalizeObject from '../../load-schema/normalize-object';

test('no name throws', () => {
  expect(() => normalizeObject(freeze({}), [])).toThrowError(
    /Expected ObjectType\.name to be a string but got undefined/,
  );
});
test('name must be alphabetic characters', () => {
  expect(() =>
    normalizeObject(freeze({name: 'something_else'}), []),
  ).toThrowError(
    /Expected ObjectType\.name to match \[A-Za-z\]\+ but got 'something_else'/,
  );
});
test('description not a string throws', () => {
  expect(() =>
    normalizeObject(freeze({name: 'Something', description: null}), []),
  ).toThrowError(/Expected Something\.description to be a string but got null/);
});
test('fields must be an object', () => {
  expect(() => normalizeObject(freeze({name: 'Something'}), [])).toThrowError(
    /Expected Something.fields to be an object but got undefined/,
  );
  expect(() =>
    normalizeObject(freeze({name: 'Something', fields: 'not an object'}), []),
  ).toThrowError(/Expected Something.fields to be an object but got string/);
});
