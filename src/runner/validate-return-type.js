import typeString from '../utils/type-name-from-definition';
import typeNameFromValue from '../utils/type-name-from-value';
import runQuery from './run-query';

const error = new TypeError('Unexpected type');

function throwIfNull(result) {
  if (result === null || result === undefined) {
    throw error;
  }
  return result;
}
function checkReturnTypeInner(
  schema: Object,
  type: {kind: string},
  value: any,
  subQuery?: Object,
  context: any,
  result: Object,
) {
  switch (type.kind) {
    case 'NotNull':
      if (value === null || value === undefined) {
        throw error;
      }
      return Promise.resolve(
        checkReturnTypeInner(schema, type.type, value, subQuery, context, result),
      ).then(throwIfNull);
    case 'List':
      if (value === null || value === undefined) return null;
      if (!Array.isArray(value)) {
        throw error;
      }
      return Promise.all(value.map((v, i) => checkReturnTypeInner(schema, type.type, v, subQuery, context, result)));
    case 'NamedTypeReference':
      if (value === null || value === undefined) return null;
      const namedType = schema[type.value];
      if (!namedType) throw new Error('Unrecognized type ' + type.value);
      switch (namedType.kind) {
        case 'NodeType':
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw error;
          }
          return runQuery(schema, namedType, value, subQuery, context, result);
        case 'ScalarType':
          try {
            return namedType.serialize(value);
          } catch (ex) {
            throw error;
          }
          break;
        default:
          throw new TypeError('Unrecognised named type kind ' + namedType.kind);
      }
      break;
    default:
      throw new TypeError('Unrecognised field type kind ' + type.kind);
  }
}


export default function validateReturnType(
  schema: Object,
  type: {kind: string},
  value: any,
  subQuery?: Object,
  context: any,
  result: Object,
): any {
  try {
    return checkReturnTypeInner(schema, type, value, subQuery, context, result);
  } catch (ex) {
    if (ex !== error) throw ex;
    const expected = typeString(type);
    const actual = typeNameFromValue(value);
    // N.B. never reveal the actual **value** of the result in here
    throw new TypeError(
      `Expected result to be of type "${expected}" but got a value of type "${actual}""`
    );
  }
}
