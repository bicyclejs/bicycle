import typeNameFromValue from '../utils/type-name-from-value';
import resolveField from './resolveField';
import reportError from '../error-reporting';
import ErrorResult, {createErrorResult} from '../types/ErrorResult';
import Logging from '../types/Logging';
import Query from '../types/Query';
import {NodeType} from '../types/Schema';

import NodeID, {createNodeID, getNode} from '../types/NodeID';
import IContext from '../types/IContext';
import QueryContext from '../types/QueryContext';
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
        return Promise.all(
          Object.keys(query).map(key => {
            const subQuery = query[key];
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
