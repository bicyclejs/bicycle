// @flow

import type {Schema} from '../flow-types';
import assert from 'assert';
import {readdirSync} from 'fs';
import freeze from '../utils/freeze';
import typeName from '../utils/type-name-from-value';
import BUILT_IN_SCALARS from '../scalars';
import suggestMatch from '../utils/suggest-match';
import normalizeObject from './normalize-object';
import normalizeScalar from './normalize-scalar';

const VALID_KEYS = ['scalars', 'objects'];
export default function loadSchema(input: Object): Schema {
  Object.keys(input).forEach(key => {
    if (VALID_KEYS.indexOf(key) === -1) {
      const suggestion = suggestMatch(VALID_KEYS, key);
      throw new Error(
        `Invalid key "${key}" in schema${suggestion}`
      );
    }
  });
  assert(
    Array.isArray(input.objects) && input.objects.every(obj => obj && typeof obj === 'object' && !Array.isArray(obj)),
    `Expected input.objects to be an Array<Object> but got ${typeName(input.objects)}`,
  );
  assert(
    input.scalars === undefined ||
    (
      Array.isArray(input.scalars) &&
      input.scalars.every(obj => obj && typeof obj === 'object' && !Array.isArray(obj))
    ),
    `Expected input.scalars to be an Array<Object> but got ${typeName(input.scalars)}`,
  );
  const types = {};
  const typeNames = [];
  let rootObject = null;
  input.objects.forEach(Type => {
    if (Type.name === 'Root') {
      rootObject = Type;
    } else if (Type.name) {
      if (typeNames.indexOf(Type.name) !== -1) {
        throw new Error(`Duplicate Object, "${Type.name}".  Each object & scalar must have a unique name.`);
      }
      typeNames.push(Type.name);
    }
  });
  if (input.scalars) {
    input.scalars.forEach(Scalar => {
      if (typeNames.indexOf(Scalar.name) !== -1) {
        throw new Error(`Duplicate Scalar, "${Scalar.name}".  Each object & scalar must have a unique name.`);
      } else if (Scalar.name) {
        typeNames.push(Scalar.name);
      }
    });
  }
  BUILT_IN_SCALARS.forEach(Scalar => {
    if (typeNames.indexOf(Scalar.name) === -1) {
      typeNames.push(Scalar.name);
    }
  });

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
    input.scalars.forEach(Scalar => {
      if (Scalar.name === 'Root') {
        throw new Error('You cannot have a scalar called Root');
      }
      types[Scalar.name] = normalizeScalar(Scalar);
    });
  }

  // objects have `id`s and a collection of `fields`
  input.objects.forEach(Type => {
    if (Type.name !== 'Root') {
      types[Type.name] = normalizeObject(Type, typeNames);
    }
  });
  if (!rootObject) {
    throw new Error('You must provide a Root object');
  }
  types.Root = normalizeObject(rootObject, typeNames);
  return freeze(types);
}

export function loadSchemaFromFiles(dirname: string): Schema {
  dirname = dirname.replace(/(\\|\/)$/, '');
  const schema = {objects: [], scalars: []};
  readdirSync(dirname + '/objects').forEach(filename => {
    // $FlowFixMe: intentionally not passing a literal to require
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
      // $FlowFixMe: intentionally not passing a literal to require
      let t = require(dirname + '/scalars/' + filename);
      if (t.default) t = t.default;
      schema.scalars.push(t);
    });
  }
  return loadSchema(schema);
}
