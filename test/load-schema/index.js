import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import loadSchema from 'bicycle/load-schema';

import './get-type';
import './normalize-object';
import './normalize-scalar';

test('non-array objects throws', () => {
  assert.throws(
    () => loadSchema(freeze({})),
    /Expected input\.objects to be an Array<Object> but got undefined/,
  );
});
test('non-array scalars throws', () => {
  assert.throws(
    () => loadSchema(freeze({scalars: null, objects: []})),
    /Expected input\.scalars to be an Array<Object> but got null/,
  );
});
