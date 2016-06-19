import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-value';

test('type-name-from-value.js', () => {
  test('null => null', () => {
    assert.strictEqual(typeName(null), 'null');
  });
  test('[] => Array', () => {
    assert.strictEqual(typeName(freeze([])), 'Array');
  });
  test('[0] => Array<number>', () => {
    assert.strictEqual(typeName(freeze([0])), 'Array<number>');
  });
  test('[0, 1, 2, 3] => Array<number>', () => {
    assert.strictEqual(typeName(freeze([0, 1, 2, 3])), 'Array<number>');
  });
  test('[0, true] => Array', () => {
    assert.strictEqual(typeName(freeze([0, true])), 'Array');
  });
  test('{} => Object', () => {
    assert.strictEqual(typeName(freeze({})), 'Object');
  });
  test('0 => number', () => {
    assert.strictEqual(typeName(0), 'number');
  });
});
