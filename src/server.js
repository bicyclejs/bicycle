import Promise from 'promise';
import bodyParser from 'body-parser';
import MemoryStore from './sessions/memory';
import handleMessages from './message-handler';
import {runQuery, runMutation} from './runner';
import responseDiff from './response-diff';

const jsonBody = bodyParser.json();
export function createMiddleware(schema, sessionStore, getContext) {
  const reqHandler = requestHandler(schema, sessionStore || new MemoryStore());
  function processRequest(req, res, next) {
    Promise.resolve(getContext(req)).then(
      context => reqHandler(req.body.sessionID, context, req.body.requests)
    ).done(
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

export function requestHandler(schema, sessionStore) {
  return (sessionID, context, requests) => {
    return handleMessages(
      requests,
      sessionID,
      sessionStore,
      mutation => runMutation(mutation, schema, context),
    ).then(query => {
      return runQuery(query, schema, context);
    }).then(response => {
      return responseDiff(response, sessionID, sessionStore);
    });
  };
}
