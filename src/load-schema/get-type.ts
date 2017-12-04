import assert = require('assert');
import SchemaKind from '../types/SchemaKind';
import ValueType from '../types/ValueType';
import suggestMatch from '../utils/suggest-match';

function getTypeFromString(
  strType: string,
  context: string,
  typeNames: Array<string>,
): ValueType {
  if (strType[strType.length - 1] === '?') {
    return {
      kind: SchemaKind.Union,
      elements: [
        getType(strType.substr(0, strType.length - 1), context, typeNames),
        {kind: SchemaKind.Null},
        {kind: SchemaKind.Void},
      ],
    };
  }
  if (
    strType[strType.length - 2] === '[' &&
    strType[strType.length - 1] === ']'
  ) {
    return {
      kind: SchemaKind.List,
      element: getType(
        strType.substr(0, strType.length - 2),
        context,
        typeNames,
      ),
    };
  }
  const contextStr = context ? ' for ' + context : '';
  assert(
    /^[A-Za-z0-9]+$/.test(strType),
    `Expected type name to match [A-Za-z0-9]+ but got '${strType}'${
      contextStr
    }`,
  );
  switch (strType) {
    case 'boolean':
      return {kind: SchemaKind.Boolean};
    case 'string':
      return {kind: SchemaKind.String};
    case 'number':
      return {kind: SchemaKind.Number};
    case 'void':
      return {kind: SchemaKind.Void};
    case 'null':
      return {kind: SchemaKind.Null};
    case 'any':
      return {kind: SchemaKind.Any};
  }
  if (typeNames.indexOf(strType) === -1) {
    const suggestion = suggestMatch(typeNames, strType);
    throw new Error(
      `${context} refers to ${strType}, but there is no type by that name${
        suggestion
      }`,
    );
  }
  return {kind: SchemaKind.Named, name: strType};
}
function getTypeFromObject(
  objType: Object,
  context: string,
  typeNames: Array<string>,
): ValueType {
  const properties = {};
  Object.keys(objType).forEach(key => {
    properties[key] = getType(objType[key], context + '.' + key, typeNames);
  });
  return {kind: SchemaKind.Object, properties};
}
function getType(
  type: {},
  context: string,
  typeNames: Array<string>,
): ValueType {
  if (typeof type === 'string') {
    return getTypeFromString(type, context, typeNames);
  } else if (type && typeof type === 'object' && !Array.isArray(type)) {
    return getTypeFromObject(type, context, typeNames);
  } else {
    throw new Error(
      `${context} has an invalid type. Types must be strings or objects.`,
    );
  }
}

export default getType;
