import SchemaKind from '../types/SchemaKind';
import {ScalarDeclaration} from '../types/Schema';
import assert from 'assert';
import getType from './get-type';
import * as TA from './TypeAssertions';

function normalizeScalar(
  Scalar: {},
  typeNames: string[],
): ScalarDeclaration<any, any> {
  const s = TA.ObjectKeys([
    'name',
    'description',
    'validate',
    'baseType',
  ]).validate(Scalar, 'Scalar');
  const name = TA.String.validate(s.name, 'Scalar.name');
  assert(
    /^[A-Za-z]+$/.test(name),
    `Expected Scalar.name to match [A-Za-z]+ but got '${name}'`,
  );
  const description = TA.Void
    .or(TA.String)
    .validate(s.description, name + '.description');
  const baseType = getType(s.baseType, name + '.baseType', typeNames);
  const validate = TA.Void.or(TA.Fn).validate(s.validate, name + '.validate');
  return {
    kind: SchemaKind.Scalar,
    name,
    description,
    baseType,
    validate: (validate || (() => true)) as (v: any) => v is any,
  };
}

export default normalizeScalar;
