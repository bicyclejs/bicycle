// @public

import assert from 'assert';
import {readdirSync} from 'fs';
import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-value';
import BUILT_IN_SCALARS from 'bicycle/scalars';
import suggestMatch from 'bicycle/utils/suggest-match';
import normalizeObject from './normalize-object';
import normalizeScalar from './normalize-scalar';

const VALID_KEYS = ['scalars', 'objects'];
export default function loadSchema(input: Object): Object {
  Object.keys(input).forEach(key => {
    if (VALID_KEYS.indexOf(key) === -1) {
      const suggestion = suggestMatch(VALID_KEYS, key);
      throw new Error(
        `Invalid key "${key}" in schema${suggestion}`
      );
    }
  });
  const types = {};

  BUILT_IN_SCALARS.forEach(Scalar => {
    types[Scalar.name] = {
      kind: 'ScalarType',
      name: Scalar.name,
      description: Scalar.description,
      serialize: Scalar.serialize,
      parse: Scalar.parse,
    };
  });
  if (input.scalars !== undefined) {
    assert(
      Array.isArray(input.scalars) && input.scalars.every(obj => obj && typeof obj === 'object' && !Array.isArray(obj)),
      `Expected input.scalars to be an Array<Object> but got ${typeName(input.scalars)}`,
    );
    input.scalars.forEach(Scalar => {
      types[Scalar.name] = normalizeScalar(Scalar);
    });
  }

  assert(
    Array.isArray(input.objects) && input.objects.every(obj => obj && typeof obj === 'object' && !Array.isArray(obj)),
    `Expected input.objects to be an Array<Object> but got ${typeName(input.objects)}`,
  );
  // objects have `id`s and a collection of `fields`
  input.objects.forEach(Type => {
    types[Type.name] = normalizeObject(Type);
  });
  return freeze(types);
}

export function loadSchemaFromFiles(dirname: string): Object {
  const schema = {objects: [], scalars: []};
  readdirSync(dirname + '/objects').forEach(filename => {
    let t = require(dirname + '/objects/' + filename);
    if (t.default) t = t.default;
    schema.objects.push(t);
  });
  let scalars = null;
  try {
    scalars = readdirSync(dirname + '/scalars');
  } catch (ex) {
    if (ex.code !== 'ENOENT') throw ex;
  }
  if (scalars) {
    scalars.forEach(filename => {
      let t = require(dirname + '/scalars/' + filename);
      if (t.default) t = t.default;
      schema.scalars.push(t);
    });
  }
  return loadSchema(schema);
}
