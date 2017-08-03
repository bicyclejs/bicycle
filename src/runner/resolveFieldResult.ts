import Query from '../types/Query';
import SchemaKind from '../types/SchemaKind';
import matchesType from './matchesType';
import ValueType from '../types/ValueType';
import {CacheData, CacheDataBase} from '../types/Cache';
import {validateResult} from './validate';
import typeNameFromDefinition from '../utils/type-name-from-definition';
import typeNameFromValue from '../utils/type-name-from-value';
import createError from '../utils/create-error';
import runQuery from './runQuery';

import IContext from '../types/IContext';
import QueryContext from '../types/QueryContext';

function getError(type: ValueType, value: any): Error {
  const expected = typeNameFromDefinition(type);
  if (process.env.NODE_ENV !== 'production') {
    const actual = typeNameFromValue(value);
    return createError(
      `Expected result to be of type "${expected}" but got "${actual}"`,
      {exposeProd: false, code: 'INVALID_RESULT_TYPE', data: {value, expected}},
    );
  }
  return createError(`Expected result to be of type "${expected}"`, {
    exposeProd: true,
    code: 'INVALID_RESULT_TYPE',
    data: {expected},
  });
}

function hasNamedType(type: ValueType): boolean {
  if (type._hasNamedType !== undefined) {
    return type._hasNamedType;
  }
  let result = false;
  switch (type.kind) {
    case SchemaKind.Union:
      result = type.elements.some(hasNamedType);
      break;
    case SchemaKind.List:
      result = hasNamedType(type.element);
      break;
    case SchemaKind.Object:
      result = Object.keys(type.properties).some(key =>
        hasNamedType(type.properties[key]),
      );
      break;
    case SchemaKind.Named:
      result = true;
      break;
    default:
      result = false;
      break;
  }
  type._hasNamedType = result;
  return result;
}

export default async function resolveFieldResult<Context extends IContext>(
  type: ValueType,
  value: any,
  subQuery: true | Query,
  qCtx: QueryContext<Context>,
): Promise<CacheData> {
  if (hasNamedType(type)) {
    switch (type.kind) {
      case SchemaKind.Union:
        if (
          type.elements.some(
            e => !hasNamedType(e) && matchesType(type, value, qCtx.schema),
          )
        ) {
          return value;
        }
        const matchingElements = type.elements.filter(
          e => hasNamedType(e) && matchesType(type, value, qCtx.schema),
        );
        if (matchingElements.length === 1) {
          return await resolveFieldResult(
            matchingElements[0],
            value,
            subQuery,
            qCtx,
          );
        } else if (matchingElements.length === 0) {
          // it did not match any of the types in the union
          throw getError(type, value);
        } else {
          // it mached more tahn one of the types in the union
          throw createError(
            `The result was ambiguous. It could be more than one of the different elements in the union "${typeNameFromDefinition(
              type,
            )}"`,
            {
              exposeProd: true,
              code: 'INVALID_RESULT_TYPE',
              data: {expected: typeNameFromDefinition(type)},
            },
          );
        }
      case SchemaKind.List:
        if (!Array.isArray(value)) {
          throw getError(type, value);
        }
        return Promise.all(
          value.map(async (v): Promise<CacheDataBase> => {
            const result = await resolveFieldResult(
              type.element,
              v,
              subQuery,
              qCtx,
            );
            if (Array.isArray(result)) {
              return result as any;
            }
            return result;
          }),
        );
      case SchemaKind.Object:
        if (
          !value ||
          typeof value !== 'object' ||
          !Object.keys(value).every(p =>
            Object.prototype.hasOwnProperty.call(type.properties, p),
          )
        ) {
          throw getError(type, value);
        }
        const result = {};
        await Promise.all(
          Object.keys(type.properties).map(async p => {
            result[p] = await resolveFieldResult(
              type.properties[p],
              value[p],
              subQuery,
              qCtx,
            );
          }),
        );
        return result;
      case SchemaKind.Named:
        const s = qCtx.schema[type.name];
        if (s.kind == SchemaKind.Scalar) {
          validateResult(s.baseType, value, qCtx.schema);
          if (!s.validate(value)) {
            throw getError(type, value);
          }
          return value;
        }
        if (!s.matches(value)) {
          throw createError(
            'Expected subQuery to be an Object but got ' +
              typeNameFromValue(subQuery) +
              ' while getting ' +
              type.name,
            {},
          );
        }
        if (!subQuery || typeof subQuery !== 'object') {
          throw createError(
            'Expected subQuery to be an Object but got ' +
              typeNameFromValue(subQuery) +
              ' while getting ' +
              type.name,
            {},
          );
        }
        return runQuery(s, value, subQuery, qCtx);
    }
  }
  validateResult(type, value, qCtx.schema);
  return value;
}
