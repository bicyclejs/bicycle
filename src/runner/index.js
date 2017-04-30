// @flow

import type {Context, MutationResult, Query, Schema} from '../flow-types';
import Promise from 'promise';
import throat from 'throat';
import ms from 'ms';
import suggestMatch from '../utils/suggest-match';
import createError from '../utils/create-error';
import {reportError} from '../error-reporting';

import {
  startMonitoringPerformance,
  stopMonitoringPerformance,
} from './resolve-field';
import runQueryInternal from './run-query';
import runMutationInternal from './run-mutation';
import runSet from './run-set';

let IS_PERFORMANCE_MONITORING = process.argv.indexOf('--monitor-bicycle-performance') !== -1;
if (IS_PERFORMANCE_MONITORING) {
  console.log('Bicycle performance monitoring is enabled.');
  console.log('Please be aware that this will make all queries much slower.');
}
export function enablePerformanceMonitoring() {
  IS_PERFORMANCE_MONITORING = true;
}
const lock = throat(Promise)(1);
export function runQuery(schema: Schema, query: Query, context: Context): Promise<Object> {
  const result = {};
  if (IS_PERFORMANCE_MONITORING) {
    return lock(() => {
      const start = Date.now();
      startMonitoringPerformance();
      return runQueryInternal(schema, schema.Root, context, query, context, result).then(() => {
        const timings = stopMonitoringPerformance();
        const end = Date.now();
        console.log('Query completed in ' + ms(end - start));
        console.log('');
        console.log('Fields that took over 10ms to resolve:');
        console.log('');
        Object.keys(timings).sort((a, b) => {
          return timings[a] - timings[b];
        }).forEach((name) => {
          if (timings[name] > 10) {
            console.log(' * ' + name + ' - ' + ms(timings[name]));
          }
        });
        console.log('');
        console.log('Note that this is the **total** time to reolve the fields,');
        console.log('so you may be seeing some fields that are requested only');
        console.log('once, but are very slow, and some fields that are quick,');
        console.log('but are requested thousands of times.');
        return result;
      });
    });
  }
  return runQueryInternal(schema, schema.Root, context, query, context, result).then(() => result);
}

export function runMutation(
  schema: Schema,
  mutation: {method: string, args: Object},
  context: Context,
): Promise<MutationResult> {
  return Promise.resolve(null).then(() => {
    const [typeName, mutationName] = mutation.method.split('.');
    const args = mutation.args;
    const Type = schema[typeName];
    if (!Type) {
      throw createError(
        'Unrecognised type for mutation: ' + typeName,
        {exposeProd: true, code: 'INVALID_MUTATION', data: {typeName, mutationName, args}},
      );
    }
    if (Type.kind !== 'NodeType') {
      throw createError(
        `The type ${typeName} is not an Object, so you cannot call the ${mutationName} mutation on it.`,
        {exposeProd: true, code: 'INVALID_MUTATION', data: {typeName, mutationName, args}},
      );
    }
    if (!Type.mutations) {
      throw createError(
        `The type ${typeName} does not define any mutations.`,
        {exposeProd: true, code: 'INVALID_MUTATION', data: {typeName, mutationName, args}},
      );
    }
    const method = Type.mutations[mutationName];
    if (!method) {
      const suggestion = suggestMatch(Object.keys(Type.mutations), mutationName);
      throw createError(
        `The type ${typeName} does not define a mutation ${mutationName}${suggestion}`,
        {exposeProd: true, code: 'INVALID_MUTATION', data: {typeName, mutationName, args, suggestion}},
      );
    }
    if (mutationName === 'set') {
      return runSet(
        schema,
        mutation,
        typeName,
        mutationName,
        Type,
        method,
        context,
      );
    }
    return runMutationInternal(
      schema,
      mutation,
      typeName,
      mutationName,
      Type,
      method,
      context,
    );
  }).then(null, err => {
    const result = (
      process.env.NODE_ENV === 'production' && !err.exposeProd
      ? {
        message: (
          'An unexpected error was encountered when running ' + mutation.method +
          ' (if you are the developer of this app, you can set "NODE_ENV" to "development" to expose the full error)'
        ),
        data: {},
        code: 'PRODUCTION_ERROR',
      }
      : {
        message: err.message + ' while running ' + mutation.method,
        data: err.data || {},
        code: err.code,
      }
    );
    err.message += ' while running ' + mutation.method;
    reportError(err);
    return {s: false, v: result};
  });
}
