// @flow

import type {ObjectType} from '../flow-types';
import assert from 'assert';
import freeze from '../utils/freeze';
import getTypeName from '../utils/type-name-from-value';
import suggestMatch from '../utils/suggest-match';
import normalizeFields from './normalize-fields';
import normalizeMutations from './normalize-mutations';

const VALID_KEYS = ['name', 'id', 'description', 'fields', 'mutations'];
function normalizeObject(Type: Object, typeNames: Array<string>): ObjectType {
  assert(
    Type && typeof Type === 'object' && !Array.isArray(Type),
    `Expected ObjectType to be an object but got ${getTypeName(Type)}`
  );
  assert(
    typeof Type.name === 'string',
    `Expected ObjectType.name to be a string but got ${getTypeName(Type.name)}`
  );
  assert(
    /^[A-Za-z]+$/.test(Type.name),
    `Expected ObjectType.name to match [A-Za-z]+ but got '${Type.name}'`,
  );
  Object.keys(Type).forEach(key => {
    if (VALID_KEYS.indexOf(key) === -1) {
      const suggestion = suggestMatch(VALID_KEYS, key);
      throw new Error(
        `Invalid key "${key}" in Object "${Type.name}"${suggestion}`
      );
    }
  });
  assert(
    Type.id === undefined || typeof Type.id === 'function',
    `Expected ${Type.name}.id to be a function but got ${getTypeName(Type.id)}`
  );
  assert(
    Type.description === undefined || typeof Type.description === 'string',
    `Expected ${Type.name}.description to be a string but got ${getTypeName(Type.description)}`
  );
  assert(
    Type.fields && typeof Type.fields === 'object',
    `Expected ${Type.name}.fields to be an object but got ${getTypeName(Type.fields)}`
  );
  assert(
    Type.mutations === undefined || typeof Type.mutations === 'object',
    `Expected ${Type.name}.mutations to be an object but got ${getTypeName(Type.mutations)}`
  );
  assert(
    Type.name !== 'Root' || Type.id === undefined,
    `The Root object always has an ID of "root".  You don't need to specify an id function yourself`
  );

  let idGetter = Type.id;
  if (!idGetter) {
    if (Type.name === 'Root') {
      idGetter = () => 'root';
    } else {
      idGetter = (node) => {
        if (typeof node.id !== 'string' && typeof node.id !== 'number') {
          if (node.id === undefined || node.id === null) {
            throw new Error('Node of type ' + Type.name + ' does not have an id');
          } else {
            throw new Error(
              'Expected node of type ' + Type.name +
              ' to have either a string or number for the "id" but got "' + getTypeName(node.id) + '"'
            );
          }
        }
        return Type.name + ':' + node.id;
      };
    }
  }
  const fields = normalizeFields(Type.fields, Type.name, typeNames);
  const mutations = Type.mutations ? normalizeMutations(Type.mutations, Type.name, typeNames) : {};
  return freeze({
    kind: 'NodeType',
    name: Type.name,
    id: idGetter,
    description: Type.description,
    fields,
    mutations,
  });
}

export default normalizeObject;
