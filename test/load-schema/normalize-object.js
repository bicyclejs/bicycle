import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import normalizeObject from 'bicycle/load-schema/normalize-object';

test('normalize-object.js', () => {
  test('no name throws', () => {
    assert.throws(
      () => normalizeObject(freeze({})),
      /Expected ObjectType\.name to be a string but got undefined/,
    );
  });
  test('name must be alphabetic characters', () => {
    assert.throws(
      () => normalizeObject(freeze({name: 'something_else'})),
      /Expected ObjectType\.name to match \[A-Za-z\]\+ but got 'something_else'/,
    );
  });
  test('description not a string throws', () => {
    assert.throws(
      () => normalizeObject(freeze({name: 'Something', description: null})),
      /Expected Something\.description to be a string but got null/,
    );
  });
  test('fields must be an object', () => {
    assert.throws(
      () => normalizeObject(freeze({name: 'Something'})),
      /Expected Something.fields to be an object but got undefined/,
    );
    assert.throws(
      () => normalizeObject(freeze({name: 'Something', fields: 'not an object'})),
      /Expected Something.fields to be an object but got string/,
    );
  });
});
