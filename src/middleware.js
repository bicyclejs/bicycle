// @flow

import type {Context, Logging, Schema, SessionStore} from './flow-types';
import Promise from 'promise';
import bodyParser from 'body-parser';
import handleMessage from './message-handler';

const jsonBody = bodyParser.json();
export default function createBicycleMiddleware(
  schema: Schema,
  logging: Logging,
  sessionStore: SessionStore,
  getContext: (req: Object, options: {stage: 'query' | 'mutation'}) => Context,
): Function {
  function processRequest(req, res, next) {
    handleMessage(schema, logging, sessionStore, req.body, () => getContext(req, {stage: 'query'}), () => getContext(req, {stage: 'mutation'})).done(
      response => res.json(response),
      err => next(err)
    );
  }
  return (req, res, next) => {
    if (req.method !== 'POST') return next();
    if (!req.body) {
      jsonBody(req, res, (err) => {
        if (err) return next(err);
        processRequest(req, res, next);
      });
    } else {
      processRequest(req, res, next);
    }
  };
}
