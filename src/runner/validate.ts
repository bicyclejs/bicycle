import matchesType from './matchesType';
import Schema from '../types/Schema';
import ValueType from '../types/ValueType';
import typeNameFromDefinition from '../utils/type-name-from-definition';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';

interface Options {
  name: string;
  exposeValueInProduction: boolean;
  code: string;
}

function validate(
  type: ValueType,
  value: any,
  schema: Schema<any>,
  options: Options,
): void {
  if (!matchesType(type, value, schema, false)) {
    const expected = typeNameFromDefinition(type);
    if (
      options.exposeValueInProduction ||
      process.env.NODE_ENV !== 'production'
    ) {
      const actual = typeNameFromValue(value);
      throw createError(
        `Expected ${options.name} to be of type "${expected}" but got "${actual}"`,
        {
          exposeProd: options.exposeValueInProduction,
          code: options.code,
          data: {value, expected},
        },
      );
    }
    throw createError(`Expected ${options.name} to be of type "${expected}"`, {
      exposeProd: true,
      code: options.code,
      data: {expected},
    });
  }
}

function createValidator(
  options: Options,
): (type: ValueType, value: any, schema: Schema<any>) => void {
  return (type, value, schema) => validate(type, value, schema, options);
}

export const validateArg = createValidator({
  name: 'arg',
  exposeValueInProduction: true,
  code: 'INVALID_ARGUMENT_TYPE',
});
export const validateResult = createValidator({
  name: 'result',
  exposeValueInProduction: false,
  code: 'INVALID_RESULT_TYPE',
});
