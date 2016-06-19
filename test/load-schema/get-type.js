import assert from 'assert';
import test from 'testit';
import getType from 'bicycle/load-schema/get-type';

test('get-type.js', () => {
  test('NamedTypeReference', () => {
    assert.deepEqual(
      getType('String?'),
      {
        kind: 'NamedTypeReference',
        value: 'String',
      },
    );
    assert.deepEqual(
      getType('String'),
      {
        kind: 'NotNull',
        type: {
          kind: 'NamedTypeReference',
          value: 'String',
        },
      },
    );
  });
  test('List', () => {
    assert.deepEqual(
      getType('String?[]?'),
      {
        kind: 'List',
        type: {
          kind: 'NamedTypeReference',
          value: 'String',
        },
      },
    );
    assert.deepEqual(
      getType('String[]'),
      {
        kind: 'NotNull',
        type: {
          kind: 'List',
          type: {
            kind: 'NotNull',
            type: {
              kind: 'NamedTypeReference',
              value: 'String',
            },
          },
        },
      },
    );
  });
  test('Throw on unexpected characters', () => {
    assert.throws(
      () => getType('my_fake_type'),
      /Expected type name to match \[A-Za-z0-9\]\+ but got 'my_fake_type'/,
    );
  });
});
