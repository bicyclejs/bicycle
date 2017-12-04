import typeNameFromValue from '../utils/type-name-from-value';
import resolveField from './resolveField';
import reportError from '../error-reporting';
import ErrorResult, {createErrorResult} from '../types/ErrorResult';
import Logging from '../types/Logging';
import Query from '../types/Query';
import {NodeType} from '../types/Schema';

import NodeID, {createNodeID, getNode} from '../types/NodeID';
import IContext from '../types/IContext';
import QueryContext, {
  MutableQuery,
  NormalizedQuery,
} from '../types/QueryContext';
import isCached from '../utils/is-cached';

function getErrorObject(
  err: Error,
  context: string,
  logging: Logging,
): ErrorResult {
  const result =
    process.env.NODE_ENV === 'production' && !err.exposeProd
      ? createErrorResult(
          'An unexpected error was encountered ' +
            context +
            ' (if you are the developer of this app, you can set "NODE_ENV" to "development" to expose the full error)',
          {},
          'PRODUCTION_ERROR',
        )
      : createErrorResult(
          err.message + ' ' + context,
          err.data || {},
          err.code,
        );
  err.message += ' ' + context;
  reportError(err, logging);
  return result;
}

function makeMutableCopy(query: Query): MutableQuery {
  const result: MutableQuery = {};
  Object.keys(query).forEach(key => {
    const q = query[key];
    if (q === true) {
      result[key] = true;
    } else {
      result[key] = makeMutableCopy(q);
    }
  });
  return result;
}
function subtractQueryPart(
  existingQuery: MutableQuery,
  newQuery: Query,
): void | Query {
  const result: MutableQuery = {};
  let added = false;
  Object.keys(newQuery).forEach(key => {
    const existingPart = existingQuery[key];
    const newPart = newQuery[key];
    if (!existingPart) {
      existingQuery[key] = newPart === true ? true : makeMutableCopy(newPart);
      result[key] = newPart;
      added = true;
      return;
    }
    if (existingPart === true || newPart === true) {
      return;
    }
    const diff = subtractQueryPart(existingPart, newPart);
    if (diff) {
      result[key] = diff;
      added = true;
      return;
    }
  });
  return added ? result : undefined;
}
function subtractQuery(
  id: NodeID,
  alreadyStartedQueries: NormalizedQuery,
  query: Query,
): void | Query {
  if (!alreadyStartedQueries[id.n]) {
    alreadyStartedQueries[id.n] = {};
    alreadyStartedQueries[id.n][id.i] = makeMutableCopy(query);
    return query;
  }
  if (!alreadyStartedQueries[id.n][id.i]) {
    alreadyStartedQueries[id.n][id.i] = makeMutableCopy(query);
    return query;
  }
  return subtractQueryPart(alreadyStartedQueries[id.n][id.i], query);
}
export default function runQuery<Context extends IContext>(
  type: NodeType<any, Context>,
  value: any,
  query: Query,
  qCtx: QueryContext<Context>,
): Promise<NodeID | ErrorResult> {
  return Promise.resolve(null)
    .then(() => type.id(value, qCtx.context, qCtx))
    .then(
      id => {
        const nodeID = createNodeID(type.name, id);
        const result = getNode(qCtx.result, nodeID);
        const remainingQuery = subtractQuery(
          nodeID,
          qCtx.startedQueries,
          query,
        );
        if (!remainingQuery) {
          return nodeID;
        }
        return Promise.all(
          Object.keys(remainingQuery).map(key => {
            const subQuery = remainingQuery[key];
            if (
              !(
                subQuery === true ||
                (subQuery != null && typeof subQuery === 'object')
              )
            ) {
              result[key] = createErrorResult(
                'Expected subQuery to be "true" or an Object but got ' +
                  typeNameFromValue(subQuery) +
                  ' while getting ' +
                  type.name +
                  '(' +
                  id +
                  ').' +
                  key,
                {},
                'INVALID_SUB_QUERY',
              );
              return;
            }
            if (isCached(qCtx.result, nodeID, key, subQuery)) {
              return;
            }
            return resolveField(type, value, key, subQuery, qCtx)
              .then(null, err => {
                return getErrorObject(
                  err,
                  'while getting ' + type.name + '(' + nodeID.i + ').' + key,
                  qCtx.logging,
                );
              })
              .then(value => {
                result[key] = value;
              });
          }),
        ).then(() => nodeID);
      },
      err => {
        return getErrorObject(
          err,
          'while getting ID of ' + type.name,
          qCtx.logging,
        );
      },
    );
}
