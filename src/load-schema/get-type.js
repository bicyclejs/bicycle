import assert from 'assert';
import freeze from 'bicycle/utils/freeze';

function getType(strType: string, context?: string): Object {
  if (strType[strType.length - 1] !== '?') {
    return freeze({kind: 'NotNull', type: getType(strType + '?')});
  }
  strType = strType.substr(0, strType.length - 1);
  if (strType[strType.length - 2] === '[' && strType[strType.length - 1] === ']') {
    return freeze({kind: 'List', type: getType(strType.substr(0, strType.length - 2))});
  }
  const contextStr = context ? ' for ' + context : '';
  assert(
    /^[A-Za-z0-9]+$/.test(strType),
    `Expected type name to match [A-Za-z0-9]+ but got '${strType}'${contextStr}`
  );
  return freeze({kind: 'NamedTypeReference', value: strType});
}

export default getType;
