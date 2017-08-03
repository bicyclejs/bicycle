import assert = require('assert');
import getTypeName from '../utils/type-name-from-value';
import normalizeFields from './normalize-fields';
import normalizeMutations from './normalize-mutations';
import * as TA from './TypeAssertions';
import SchemaKind from '../types/SchemaKind';
import {NodeType} from '../types/Schema';

function normalizeObject(
  Type: {},
  typeNames: Array<string>,
): NodeType<any, any> {
  const typeName = TA.String.validate(
    TA.AnyObject.validate(Type, 'ObjectType').name,
    'ObjectType.name',
  );
  const t = TA.ObjectKeys([
    'name',
    'id',
    'description',
    'fields',
    'mutations',
  ]).validate(Type, typeName);
  assert(
    /^[A-Za-z]+$/.test(typeName),
    `Expected ObjectType.name to match [A-Za-z]+ but got '${typeName}'`,
  );
  const id = TA.Void.or(TA.Fn).validate(t.id, typeName + '.id');
  const description = TA.Void
    .or(TA.String)
    .validate(t.description, typeName + '.description');

  assert(
    typeName !== 'Root' || id === undefined,
    `The Root object always has an ID of "root".  You don't need to specify an id function yourself`,
  );

  let idGetter = id;
  if (!idGetter) {
    if (typeName === 'Root') {
      idGetter = () => 'root';
    } else {
      idGetter = node => {
        if (typeof node.id !== 'string' && typeof node.id !== 'number') {
          if (node.id === undefined || node.id === null) {
            throw new Error(
              'Node of type ' + typeName + ' does not have an id',
            );
          } else {
            throw new Error(
              'Expected node of type ' +
                typeName +
                ' to have either a string or number for the "id" but got "' +
                getTypeName(node.id) +
                '"',
            );
          }
        }
        return node.id;
      };
    }
  }
  const fields = normalizeFields(
    TA.AnyObject.validate(t.fields, typeName + '.fields'),
    typeName,
    typeNames,
  );
  const m = TA.Void
    .or(TA.AnyObject)
    .validate(t.mutations, typeName + '.mutations');
  const mutations = m ? normalizeMutations(m, typeName, typeNames, fields) : {};
  return {
    kind: SchemaKind.NodeType,
    name: typeName,
    id: idGetter,
    description,
    fields,
    mutations,
    matches(value: any): value is any {
      // untyped mode does not support unions
      return true;
    },
  };
}

export default normalizeObject;
