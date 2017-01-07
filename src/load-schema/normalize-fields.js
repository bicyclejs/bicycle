// @flow

import type {FieldType} from '../flow-types';
import assert from 'assert';
import freeze from '../utils/freeze';
import getTypeName from '../utils/type-name-from-value';
import normalizeField from './normalize-field';

function normalizeFields(fields: Object, typeName: string, typeNames: Array<string>): {[key: string]: FieldType} {
  const result = {};
  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    if (field === undefined) return;
    assert(
      /^[A-Za-z0-9]+$/.test(fieldName),
      `Expected ${typeName}'s field names to match [A-Za-z0-9]+ but got '${fieldName}'`,
    );
    assert(
      (field && typeof field === 'object') || typeof field === 'string',
      `Expected ${typeName}.${fieldName} to be an object or a string but got ${getTypeName(field)}`
    );
    result[fieldName] = normalizeField(
      typeof field === 'string' ? {type: field} : field,
      typeName,
      fieldName,
      typeNames,
    );
  });
  return freeze(result);
}

export default normalizeFields;
