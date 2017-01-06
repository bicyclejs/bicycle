// TODO: don't run this until all the other tests have passed

import express from 'express';
import BicycleClient, {NetworkLayer} from 'bicycle/client';
import {
  loadSchemaFromFiles,
  createBicycleMiddleware,
  runQuery,
  onBicycleError,
  silenceDefaultBicycleErrorReporting,
} from 'bicycle/server';
import MemoryStore from 'bicycle/sessions/memory';

let allowErrors = false;
const serverErrors = [];
onBicycleError(err => {
  if (allowErrors) {
    serverErrors.push(err);
  } else {
    throw err;
  }
});
silenceDefaultBicycleErrorReporting();

const schema = loadSchemaFromFiles(__dirname + '/../test-schema');
test('a successful query', () => {
  const app = express();
  // sessions expire after just 1 second for testing
  const sessionStore = new MemoryStore(1000);
  const todo = {id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Hello World', completed: false};
  app.use('/bicycle', createBicycleMiddleware(schema, sessionStore, req => {
    return {
      db: {
        getTodos() {
          // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
          return [todo];
        },
      },
    };
  }));
  const server = app.listen(3000);
  return new Promise((resolve, reject) => {
    const client = new BicycleClient(
      new NetworkLayer('http://localhost:3000/bicycle'),
    );
    client.subscribe(
      {todos: {id: true, title: true, completed: true}},
      (result, loaded, errors, errorDetails) => {
        try {
          expect(typeof result).toBe('object');
          expect(typeof loaded).toBe('boolean');
          expect(Array.isArray(errors)).toBe(true);
          expect(Array.isArray(errorDetails)).toBe(true);
          if (errors.length) {
            throw new Error(errors[0]);
          }
          if (loaded) {
            expect(
              result,
            ).toEqual(
              {todos: [todo]}
            );
            server.close();
            resolve();
          }
        } catch (ex) {
          server.close();
          reject(ex);
        }
      },
    );
  });
});
test('a successful server query', () => {
  const todo = {id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Hello World', completed: false};
  const context = {
    db: {
      getTodos() {
        // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
        return [todo];
      },
    },
  };
  return runQuery(schema, {todos: {id: true, title: true, completed: true}}, context).then(result => {
    expect(
      result,
    ).toEqual(
      {todos: [todo]}
    );
  });
});

test('a failing query', () => {
  allowErrors = true;
  const app = express();
  // sessions expire after just 1 second for testing
  const sessionStore = new MemoryStore(1000);
  app.use('/bicycle', createBicycleMiddleware(schema, sessionStore, req => {
    return {
      db: {
        getTodos() {
          return Promise.reject(new Error('Whatever'));
        },
      },
    };
  }));
  const server = app.listen(3000);
  return new Promise((resolve, reject) => {
    const client = new BicycleClient(
      new NetworkLayer('http://localhost:3000/bicycle'),
    );
    client.subscribe(
      {todos: {id: true, title: true, completed: true}},
      (result, loaded, errors, errorDetails) => {
        try {
          expect(typeof result).toBe('object');
          expect(typeof loaded).toBe('boolean');
          expect(Array.isArray(errors)).toBe(true);
          expect(Array.isArray(errorDetails)).toBe(true);
          if (loaded) {
            allowErrors = false;
            expect(serverErrors.length).toBe(1);
            expect(serverErrors[0].message).toBe('Whatever while getting Root(root).todos');
            expect(
              result,
            ).toEqual(
              {
                todos: {
                  _type: 'ERROR',
                  value: 'Whatever while getting Root(root).todos',
                  data: {},
                },
              },
            );
            expect(
              errors,
            ).toEqual(
              ['Whatever while getting Root(root).todos'],
            );
            expect(
              errorDetails,
            ).toEqual(
              [
                {
                  _type: 'ERROR',
                  value: 'Whatever while getting Root(root).todos',
                  data: {},
                },
              ],
            );
            server.close();
            resolve();
          }
        } catch (ex) {
          server.close();
          reject(ex);
        }
      },
    );
  });
});
