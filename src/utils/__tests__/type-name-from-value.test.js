// @flow

import freeze from '../freeze';
import typeName from '../type-name-from-value';

test('null => null', () => {
  expect(typeName(null)).toBe('null');
});
test('[] => Array', () => {
  expect(typeName(freeze([]))).toBe('Array');
});
test('[0] => Array<number>', () => {
  expect(typeName(freeze([0]))).toBe('Array<number>');
});
test('[0, 1, 2, 3] => Array<number>', () => {
  expect(typeName(freeze([0, 1, 2, 3]))).toBe('Array<number>');
});
test('[0, true] => Array', () => {
  expect(typeName(freeze([0, true]))).toBe('Array');
});
test('{} => Object', () => {
  expect(typeName(freeze({}))).toBe('Object');
});
test('0 => number', () => {
  expect(typeName(0)).toBe('number');
});
