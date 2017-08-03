// @flow

import freeze from '../freeze';
import typeNameFromValue from '../type-name-from-value';

test('null', () => {
  expect(typeNameFromValue(null)).toBe('null');
});
test('[]', () => {
  expect(typeNameFromValue(freeze([]))).toBe('[]');
});
test('[0]', () => {
  expect(typeNameFromValue(freeze([0]))).toBe('number[]');
});
test('[0, 1, 2, 3]', () => {
  expect(typeNameFromValue(freeze([0, 1, 2, 3]))).toBe('number[]');
});
test('[0, true]', () => {
  expect(typeNameFromValue(freeze([0, true]))).toBe('(boolean | number)[]');
});
test('{}', () => {
  expect(typeNameFromValue(freeze({}))).toBe('{}');
});
test('0', () => {
  expect(typeNameFromValue(0)).toBe('number');
});
