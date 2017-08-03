import throat from 'throat';
import ms = require('ms');
import suggestMatch from '../utils/suggest-match';
import createError from '../utils/create-error';
import reportError from '../error-reporting';

import {
  startMonitoringPerformance,
  stopMonitoringPerformance,
} from './resolveField';
import runQueryInternal from './runQuery';
import runMutationInternal from './runMutation';

import Cache from '../types/Cache';
import IContext from '../types/IContext';
import Logging from '../types/Logging';
import MutationContext from '../types/MutationContext';
import MutationResult from '../types/MutationResult';
import Query from '../types/Query';
import Schema from '../types/Schema';

let IS_PERFORMANCE_MONITORING =
  process.argv.indexOf('--monitor-bicycle-performance') !== -1;
if (IS_PERFORMANCE_MONITORING) {
  console.log('Bicycle performance monitoring is enabled.');
  console.log('Please be aware that this will make all queries much slower.');
}
export function enablePerformanceMonitoring() {
  IS_PERFORMANCE_MONITORING = true;
}
const lock = throat(1);
export function runQuery<Context extends IContext>(
  query: Query,
  {
    schema,
    logging,
    context,
  }: {
    schema: Schema<IContext>;
    logging: Logging;
    context: Context;
  },
): Promise<Cache> {
  const result = {};
  const qCtx = {
    schema,
    context,
    logging,
    result,
  };
  logging.onQueryStart({query, context});
  if (IS_PERFORMANCE_MONITORING) {
    return lock((): Promise<Cache> => {
      const start = Date.now();
      startMonitoringPerformance();
      return runQueryInternal(schema.Root, context, query, qCtx).then(() => {
        const {count, timings} = stopMonitoringPerformance();
        const end = Date.now();
        console.log('Query completed in ' + ms(end - start));
        console.log('');
        console.log('Fields that took over 10ms to resolve:');
        console.log('');
        Object.keys(timings)
          .sort((a, b) => {
            return timings[a] - timings[b];
          })
          .forEach(name => {
            if (timings[name] > 10) {
              console.log(
                ` * ${name} - ${ms(timings[name])} (${count[name]} call${count[
                  name
                ] !== 1
                  ? 's'
                  : ''})`,
              );
            }
          });
        console.log('');
        console.log(
          'Note that this is the **total** time to reolve the fields,',
        );
        console.log('so you may be seeing some fields that are requested only');
        console.log('once, but are very slow, and some fields that are quick,');
        console.log('but are requested thousands of times.');
        if (logging) {
          return Promise.resolve(
            logging.onQueryEnd({query, cacheResult: result, context}),
          ).then(() => result);
        }
        return result;
      });
    });
  }
  return runQueryInternal(schema.Root, context, query, qCtx).then(() => {
    logging.onQueryEnd({query, cacheResult: result, context});
    return result;
  });
}

export function runMutation<Context extends IContext>(
  mutation: {method: string; args: any},
  mCtx: MutationContext<Context>,
): Promise<MutationResult<any>> {
  return Promise.resolve(
    mCtx.logging.onMutationStart({mutation, context: mCtx.context}),
  )
    .then(() => {
      const [typeName, mutationName] = mutation.method.split('.');
      const args = mutation.args;
      const Type = mCtx.schema[typeName];
      if (!Type) {
        throw createError('Unrecognised type for mutation: ' + typeName, {
          exposeProd: true,
          code: 'INVALID_MUTATION',
          data: {typeName, mutationName, args},
        });
      }
      if (Type.kind !== 'NodeType') {
        throw createError(
          `The type ${typeName} is not an Object, so you cannot call the ${mutationName} mutation on it.`,
          {
            exposeProd: true,
            code: 'INVALID_MUTATION',
            data: {typeName, mutationName, args},
          },
        );
      }
      if (!Type.mutations) {
        throw createError(
          `The type ${typeName} does not define any mutations.`,
          {
            exposeProd: true,
            code: 'INVALID_MUTATION',
            data: {typeName, mutationName, args},
          },
        );
      }
      const method = Type.mutations[mutationName];
      if (!method) {
        const suggestion = suggestMatch(
          Object.keys(Type.mutations),
          mutationName,
        );
        throw createError(
          `The type ${typeName} does not define a mutation ${mutationName}${suggestion}`,
          {
            exposeProd: true,
            code: 'INVALID_MUTATION',
            data: {typeName, mutationName, args, suggestion},
          },
        );
      }
      return runMutationInternal(method, mutation.args, mCtx);
    })
    .then<MutationResult<any>, MutationResult<any>>(null, err => {
      const result =
        process.env.NODE_ENV === 'production' && !err.exposeProd
          ? {
              message:
                'An unexpected error was encountered when running ' +
                mutation.method +
                ' (if you are the developer of this app, you can set "NODE_ENV" to "development" to expose the full error)',
              data: {},
              code: 'PRODUCTION_ERROR',
            }
          : {
              message: err.message + ' while running ' + mutation.method,
              data: err.data || {},
              code: err.code,
            };
      err.message += ' while running ' + mutation.method;
      reportError(err, mCtx.logging);
      return {s: false, v: result};
    })
    .then<MutationResult<any>>(result => {
      return Promise.resolve(
        mCtx.logging.onMutationEnd({mutation, result, context: mCtx.context}),
      ).then(() => result);
    });
}
