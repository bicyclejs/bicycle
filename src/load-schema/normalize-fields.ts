import assert = require('assert');
import {Field} from '../types/Schema';
import normalizeField from './normalize-field';
import ta from './TypeAssertions';

function normalizeFields(
  fields: unknown,
  typeName: string,
  typeNames: Array<string>,
): {[fieldName: string]: Field<any, any, any, any>} {
  const result = {};
  const f = ta.AnyObject.validate(fields, typeName + '.fields');
  Object.keys(f).forEach(fieldName => {
    const field = f[fieldName];
    if (field === undefined) return;
    assert(
      /^[A-Za-z0-9]+$/.test(fieldName),
      `Expected ${typeName}'s field names to match [A-Za-z0-9]+ but got '${fieldName}'`,
    );
    result[fieldName] = normalizeField(field, fieldName, typeName, typeNames);
  });
  return result;
}

export default normalizeFields;
