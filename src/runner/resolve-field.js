// @flow

import type {Context, Logging, ObjectType, Query, Schema} from '../flow-types';
import Promise from 'promise';
import throat from 'throat';
import freeze from '../utils/freeze';
import suggestMatch from '../utils/suggest-match';
import parseArgs from './args-parser';
import validateArgs from './args-validator';
import validateReturnType from './validate-return-type';
import {ERROR} from '../constants';

const EMPTY_OBJECT = freeze({});

let isPerformanceMonitoring = false;
const lock = throat(Promise)(1);
let timings = EMPTY_OBJECT;
let count = EMPTY_OBJECT;

export function startMonitoringPerformance() {
  isPerformanceMonitoring = true;
  return {timings: timings = {}, count: count = {}};
}
export function stopMonitoringPerformance() {
  const oldTimings = timings;
  const oldCount = count;
  isPerformanceMonitoring = false;
  timings = EMPTY_OBJECT;
  count = EMPTY_OBJECT;
  return {timings: oldTimings, count: oldCount};
}

function time(fn, id) {
  return (...args) => lock(() => {
    const start = Date.now();
    return Promise.resolve(fn(...args)).then(result => {
      const end = Date.now();
      if (typeof timings[id] !== 'number') {
        timings[id] = 0;
      }
      if (typeof count[id] !== 'number') {
        count[id] = 0;
      }
      timings[id] += (end - start);
      count[id]++;
      return result;
    });
  });
}

/**
 * Resolve a single field on a node to a value to be returned to the client
 */
export default function resolveField(
  schema: Schema,
  logging: Logging,
  type: ObjectType,
  value: any,
  name: string,
  subQuery: true | Query,
  context: Context,
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
      let resolveField = type.fields[fname].resolve;
      if (isPerformanceMonitoring) {
        resolveField = time(resolveField, `${type.name}.${fname}`);
      }
      const argsObj = freeze(
        type.fields[fname].args
        ? validateArgs(schema, type.fields[fname].args, parseArgs(args))
        : EMPTY_OBJECT
      );
      return Promise.resolve(resolveField(value, argsObj, context, freeze({
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
      logging,
      type.fields[fname].type,
      value,
      subQuery === true ? null : subQuery,
      context,
      result,
    );
  });
}
