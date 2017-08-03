import {Request, RequestHandler} from 'express';
import {json} from 'body-parser';
import handleMessage from './handleMessage';
import SessionStore from './sessions/SessionStore';
import IContext from './types/IContext';
import Logging from './types/Logging';
import Schema from './types/Schema';

const jsonBody = json();
export default function createBicycleMiddleware<Context extends IContext>(
  schema: Schema<Context>,
  logging: Logging,
  sessionStore: SessionStore,
  getContext: (req: Request, options: {stage: 'query' | 'mutation'}) => Context,
): RequestHandler {
  const processRequest: RequestHandler = (req, res, next) => {
    handleMessage(
      schema,
      logging,
      sessionStore,
      req.body,
      () => getContext(req, {stage: 'query'}),
      () => getContext(req, {stage: 'mutation'}),
    ).then(response => res.json(response), err => next(err));
  };
  return (req, res, next) => {
    if (req.method !== 'POST') return next();
    if (!req.body) {
      jsonBody(req, res, err => {
        if (err) return next(err);
        processRequest(req, res, next);
      });
    } else {
      processRequest(req, res, next);
    }
  };
}
