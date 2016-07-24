import Promise from 'promise';
import bodyParser from 'body-parser';
import handleMessage from './message-handler';

const jsonBody = bodyParser.json();
export default function createBicycleMiddleware(
  schema: Object,
  sessionStore: {
    getCache: Function,
    setCache: Function,
    getQuery: Function,
    setQuery: Function,
  },
  getContext: Function
): Function {
  function processRequest(req, res, next) {
    Promise.resolve(null).then(
     () => getContext(req)
   ).then(
      context => handleMessage(schema, sessionStore, req.body, context)
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