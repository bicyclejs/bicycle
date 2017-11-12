import suggestMatch from '../utils/suggest-match';
import {validateArg} from './validate';
import resolveFieldResult from './resolveFieldResult';

import {CacheData} from '../types/Cache';
import {createErrorResult, isErrorResult} from '../types/ErrorResult';
import Query from '../types/Query';
import SchemaKind from '../types/SchemaKind';
import {NodeType} from '../types/Schema';

import IContext from '../types/IContext';
import QueryContext from '../types/QueryContext';
import parseLegacyArgs from './legacyArgParser';

const EMPTY_OBJECT = {};

let isPerformanceMonitoring = false;
let timings = EMPTY_OBJECT;
let count = EMPTY_OBJECT;

export function startMonitoringPerformance() {
  isPerformanceMonitoring = true;
  return {timings: (timings = {}), count: (count = {})};
}
export function stopMonitoringPerformance() {
  const oldTimings = timings;
  const oldCount = count;
  isPerformanceMonitoring = false;
  timings = EMPTY_OBJECT;
  count = EMPTY_OBJECT;
  return {timings: oldTimings, count: oldCount};
}

const waitingFields: Map<string, (() => Promise<void>)[]> = new Map();
const queue: string[] = [];
let running = false;

function runTiming() {
  running = true;
  const start = Date.now();
  const id = queue.pop();
  if (!id) {
    return;
  }
  const fns = waitingFields.get(id) || [];
  waitingFields.delete(id);
  return Promise.all(fns.map(f => f())).then(() => {
    const end = Date.now();
    if (typeof timings[id] !== 'number') {
      timings[id] = 0;
    }
    if (typeof count[id] !== 'number') {
      count[id] = 0;
    }
    timings[id] += end - start;
    count[id] += fns.length;
    if (queue.length) {
      runTiming();
    } else {
      running = false;
    }
  });
}

function time(fn: (...args: any[]) => any, id: string) {
  return (...args: any[]) =>
    new Promise((resolve, reject) => {
      if (!waitingFields.has(id)) {
        waitingFields.set(id, []);
        queue.push(id);
      }
      (waitingFields.get(id) || []).push(() => {
        return Promise.resolve(null)
          .then(() => fn(...args))
          .then(resolve, reject);
      });
      if (!running) {
        runTiming();
      }
    });
}

/**
 * Resolve a single field on a node to a value to be returned to the client
 */
export default function resolveField<Context extends IContext>(
  type: NodeType<any, Context>,
  value: any,
  name: string,
  subQuery: true | Query,
  qCtx: QueryContext<Context>,
): Promise<CacheData> {
  const fname = name.split('(')[0];
  const args =
    name.indexOf('(') !== -1
      ? name
          .split('(')
          .slice(1)
          .join('(')
          .replace(/\)$/, '')
      : undefined;
  let parsedArg: any = undefined;
  if (args) {
    if (/^\s*[a-zA-Z0-9]+\s*\:/.test(args)) {
      parsedArg = parseLegacyArgs('(' + args + ')');
    } else {
      parsedArg = JSON.parse(args);
    }
  }
  const field = type.fields[fname];
  if (!field) {
    const suggestion = suggestMatch(Object.keys(type.fields), fname);
    return Promise.resolve(
      createErrorResult(
        `Field "${fname}" does not exist on type "${type.name}"${suggestion}`,
        undefined,
        'MISSING_FIELD_NAME',
      ),
    );
  }
  if (field.kind === SchemaKind.FieldProperty) {
    return resolveFieldResult(
      field.resultType,
      value[fname],
      subQuery,
      qCtx,
    ).then(result => (result === undefined ? null : result));
  }
  return Promise.resolve(null)
    .then(() => {
      if (typeof field.resolve !== 'function') {
        return createErrorResult(
          `Expected ${type.name}.${fname}.resolve to be a function.`,
          undefined,
          'INVALID_SCHEMA',
        );
      }
      let resolveField = field.resolve;
      if (isPerformanceMonitoring) {
        resolveField = time(resolveField, `${type.name}.${fname}`);
      }
      validateArg(field.argType, parsedArg, qCtx.schema);
      return Promise.resolve(
        field.auth === 'public' ||
          field.auth(value, parsedArg, qCtx.context, subQuery, qCtx),
      ).then(hasAuth => {
        if (!hasAuth) {
          return createErrorResult(
            `Auth failed for ${type.name}.${fname}.`,
            undefined,
            'AUTH_FAILED',
          );
        }
        return resolveField(value, parsedArg, qCtx.context, subQuery, {
          fieldName: fname,
          subQuery,
          schema: qCtx.schema,
          context: qCtx.context,
          result: qCtx.result,
          logging: qCtx.logging,
        });
      });
    })
    .then<CacheData>(value => {
      if (isErrorResult(value)) return value;
      return resolveFieldResult(field.resultType, value, subQuery, qCtx);
    })
    .then(value => (value === undefined ? null : value));
}
