import SchemaKind from '../types/SchemaKind';
import {ScalarDeclaration} from '../types/Schema';
import assert = require('assert');
import getType from './get-type';
import ta from './TypeAssertions';

function normalizeScalar(
  Scalar: unknown,
  typeNames: string[],
): ScalarDeclaration<any, any> {
  const s = ta
    .ObjectKeys(['name', 'description', 'validate', 'baseType'])
    .validate(Scalar, 'Scalar');
  const name = ta.String.validate(s.name, 'Scalar.name');
  assert(
    /^[A-Za-z]+$/.test(name),
    `Expected Scalar.name to match [A-Za-z]+ but got '${name}'`,
  );
  const description = ta.Void.or(ta.String).validate(
    s.description,
    name + '.description',
  );
  const baseType = getType(s.baseType, name + '.baseType', typeNames);
  const validate = ta.Void.or(ta.Fn).validate(s.validate, name + '.validate');
  return {
    kind: SchemaKind.Scalar,
    name,
    description,
    baseType,
    validate: (validate || (() => true)) as (v: any) => v is any,
  };
}

export default normalizeScalar;
