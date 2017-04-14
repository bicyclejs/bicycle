// @flow

import type {TypeDefinition} from '../flow-types';
import assert from 'assert';
import freeze from '../utils/freeze';
import suggestMatch from '../utils/suggest-match';

function getTypeFromString(strType: string, context: string, typeNames: Array<string>): TypeDefinition {
  if (strType[strType.length - 1] !== '?') {
    return freeze({kind: 'NotNull', type: getType(strType + '?', context, typeNames)});
  }
  strType = strType.substr(0, strType.length - 1);
  if (strType[strType.length - 2] === '[' && strType[strType.length - 1] === ']') {
    return freeze({kind: 'List', type: getType(strType.substr(0, strType.length - 2), context, typeNames)});
  }
  const contextStr = context ? ' for ' + context : '';
  assert(
    /^[A-Za-z0-9]+$/.test(strType),
    `Expected type name to match [A-Za-z0-9]+ but got '${strType}'${contextStr}`
  );
  if (typeNames.indexOf(strType) === -1) {
    const suggestion = suggestMatch(typeNames, strType);
    throw new Error(
      `${context} refers to ${strType}, but there is no type by that name${suggestion}`
    );
  }
  return freeze({kind: 'NamedTypeReference', value: strType});
}
function getTypeFromObject(objType: Object, context: string, typeNames: Array<string>): TypeDefinition {
  const properties = {};
  Object.keys(objType).forEach(key => {
    properties[key] = getType(objType[key], context, typeNames);
  });
  return freeze({kind: 'NotNull', type: {kind: 'ObjectScalar', properties}});
}
function getType(type: string | Object, context: string, typeNames: Array<string>): TypeDefinition {
  if (typeof type === 'string') {
    return getTypeFromString(type, context, typeNames);
  } else {
    return getTypeFromObject(type, context, typeNames);
  }
}

export default getType;
