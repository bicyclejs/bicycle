// @flow

import type {FieldType} from '../flow-types';
import assert from 'assert';
import freeze from '../utils/freeze';
import getTypeName from '../utils/type-name-from-value';
import suggestMatch from '../utils/suggest-match';
import getType from './get-type';
import normalizeArgs from './normalize-args';

const VALID_KEYS = ['type', 'description', 'args', 'resolve'];

function normalizeField(field: Object, fieldName: string, typeName: string, typeNames: Array<string>): FieldType {
  Object.keys(field).forEach(key => {
    if (VALID_KEYS.indexOf(key) === -1) {
      const suggestion = suggestMatch(VALID_KEYS, key);
      throw new Error(
        `Invalid key "${key}" in ${typeName}.${fieldName}${suggestion}`
      );
    }
  });
  assert(
    typeof field.type === 'string',
    `Expected ${typeName}.${fieldName}.type to be a string but got ${getTypeName(field.type)}`
  );
  assert(
    field.args === undefined || (field.args && typeof field.args === 'object'),
    `Expected ${typeName}.${fieldName}.args to be an object but got ${getTypeName(field.args)}`,
  );
  return freeze({
    type: getType(field.type, typeName + '.' + fieldName, typeNames),
    args: field.args ? normalizeArgs(field.args, typeName, fieldName, typeNames) : undefined,
    description: field.description,
    resolve: field.resolve,
  });
}

export default normalizeField;
