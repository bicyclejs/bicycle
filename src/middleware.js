import Promise from 'promise';
import graphqlHTTP from 'express-graphql';
import bodyParser from 'body-parser';

import {formatError} from 'graphql/error';
import {execute} from 'graphql/execution';
import {parse, Source} from 'graphql/language';
import {validate} from 'graphql/validation';

const jsonBody = bodyParser.json();

export default function (schema, rawSchema, rootValue) {
  let graphiql = null;
  if (process.env.NODE_ENV !== 'production') {
    graphiql = graphqlHTTP(request => ({schema, rootValue: rootValue(request), graphiql: true, pretty: true}));
  }
  function normalize(data) {
    const result = {};
    function normalizeField(obj) {
      if (obj && typeof obj === 'object' && typeof obj.id === 'string') {
        const resultObj = {};
        Object.keys(obj).forEach(key => {
          resultObj[key] = normalizeField(obj[key]);
        });
        result[obj.id] = resultObj;
        return obj.id;
      } else if (Array.isArray(obj)) {
        return obj.map(normalizeField);
      } else {
        return obj;
      }
    }
    normalizeField(data);
    return result;
  }
  function handleRequest(req, res, next) {
    Promise.resolve(null).then(() => {
      const rv = rootValue(req);
      const q = req.body.query;

      // GraphQL source.
      const source = new Source(q, 'GraphQL request');

      // Parse source to AST, reporting any syntax error.
      let documentAST;
      try {
        documentAST = parse(source);
      } catch (syntaxError) {
        // Return 400: Bad Request if any syntax errors errors exist.
        res.status(400);
        return {errors: [syntaxError]};
      }

      // Validate AST, reporting any errors.
      const validationErrors = validate(schema, documentAST);
      if (validationErrors.length > 0) {
        // Return 400: Bad Request if any validation errors exist.
        res.status(400);
        return {errors: validationErrors};
      }


      // Perform the execution, reporting any errors creating the context.
      try {
        return execute(
          schema,
          documentAST,
          rv,
          {}
        );
      } catch (contextError) {
        // Return 400: Bad Request if any execution context errors exist.
        res.status(400);
        return {errors: [contextError]};
      }
      next();
    }).then(null, err => {
      res.status(err.status || 500);
      return {errors: [err]};
    }).then(result => {
      if (result && result.errors) {
        result.errors = result.errors.map(formatError);
      }
      result.data = normalize(result.data);
      res.json(result);
    }).done();
  }
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      if (/graphiql/.test(req.path)) {
        return graphiql(req, res, next);
      }
      if (req.method === 'GET') {
        res.redirect(req.baseUrl.replace(/\/$/, '') + '/graphiql');
      }
    }
    if (req.method !== 'POST') return next();
    if (!req.body) {
      jsonBody(req, res, (err) => {
        if (err) return next(err);
        handleRequest(req, res, next);
      });
    } else {
      handleRequest(req, res, next);
    }
  };
}
