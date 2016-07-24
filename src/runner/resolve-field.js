import Promise from 'promise';
import freeze from 'bicycle/utils/freeze';
import suggestMatch from 'bicycle/utils/suggest-match';
import parseArgs from './args-parser';
import validateArgs from './args-validator';
import validateReturnType from './validate-return-type';
import {ERROR} from '../constants';

const EMPTY_OBJECT = freeze({});

/**
 * Resolve a single field on a node to a value to be returned to the client
 */
export default function resolveField(
  schema: Object,
  type: {name: string, fields: Object},
  value: any,
  name: string,
  subQuery: true | Object,
  context: any,
  result: Object,
): any {
  const fname = name.split('(')[0];
  const args = name.indexOf('(') !== -1 ? '(' + name.split('(').slice(1).join('(') : '()';
  return Promise.resolve(null).then(() => {
    if (!type.fields[fname]) {
      const suggestion = suggestMatch(Object.keys(type.fields), fname);
      return {
        _type: ERROR,
        value: `Field "${fname}" does not exist on type "${type.name}"${suggestion}`,
      };
    } else if (type.fields[fname].resolve) {
      if (typeof type.fields[fname].resolve !== 'function') {
        return {
          _type: ERROR,
          value: `Expected ${type.name}.${fname}.resolve to be a function.`,
        };
      }
      const argsObj = freeze(
        type.fields[fname].args
        ? validateArgs(schema, type.fields[fname].args, parseArgs(args))
        : EMPTY_OBJECT
      );
      return Promise.resolve(type.fields[fname].resolve(value, argsObj, context, freeze({
        type: type.name,
        name,
        subQuery: subQuery === true ? null : subQuery,
      })));
    } else if (type.fields[fname]) {
      return value[fname];
    }
  }).then(value => {
    if (value && value._type === ERROR) return value;
    return validateReturnType(
      schema,
      type.fields[fname].type,
      value,
      subQuery === true ? null : subQuery,
      context,
      result,
    );
  });
}
