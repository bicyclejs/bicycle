import {Request, Response, RequestHandler} from 'express';
import {json} from 'body-parser';
import handleMessage from './handleMessage';
import SessionStore from './sessions/SessionStore';
import Logging from './types/Logging';
import Schema from './types/Schema';
import {Ctx} from './Ctx';

const jsonBody = json();
export default function createBicycleMiddleware<Context>(
  schema: Schema<Context>,
  logging: Logging,
  sessionStore: SessionStore,
  getContext: (
    req: Request,
    res: Response,
    options: {stage: 'query' | 'mutation'},
  ) => Ctx<Context>,
): RequestHandler {
  const processRequest: RequestHandler = (req, res, next) => {
    handleMessage(
      schema,
      logging,
      sessionStore,
      req.body,
      () => getContext(req, res, {stage: 'query'}),
      () => getContext(req, res, {stage: 'mutation'}),
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
