// TODO: don't run this until all the other tests have passed

import {Request, Response, NextFunction} from 'express';
import express = require('express');
import getPort = require('get-port');
import BicycleClient, {NetworkLayer} from '../client';
import BicycleServer from '../server';
import MemoryStore from '../sessions/MemorySessionStore';
import {createErrorResult} from '../types/ErrorResult';
import {createNodeID} from '../types/NodeID';

let allowErrors = false;
const serverErrors: Error[] = [];

// sessions expire after just 1 second for testing
const sessionStore = new MemoryStore(1000);
const bicycle = new BicycleServer(__dirname + '/../test-schema', {
  sessionStore,
  disableDefaultLogging: true,
  onError({error}) {
    if (allowErrors) {
      serverErrors.push(error);
    } else {
      console.error(error.stack);
      throw error;
    }
  },
});

test('a successful query', () => {
  const app = express();
  const todo = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Hello World',
    completed: false,
  };
  app.use(
    '/bicycle',
    bicycle.createMiddleware((req, res) => {
      return {
        db: {
          getTodos() {
            // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
            return [todo];
          },
        },
      };
    }),
  );
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.statusCode = 500;
    res.end(err.stack);
  });
  return getPort()
    .then(port => ({server: app.listen(port), port}))
    .then(({server, port}) => {
      return new Promise((resolve, reject) => {
        const client = new BicycleClient(
          new NetworkLayer('http://localhost:' + port + '/bicycle'),
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
                expect(result).toEqual({todos: [todo]});
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
});
test('a successful server query', () => {
  const todo = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Hello World',
    completed: false,
  };
  const context = {
    db: {
      getTodos() {
        // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
        return [todo];
      },
    },
  };
  return bicycle
    .runQuery({todos: {id: true, title: true, completed: true}}, context)
    .then(result => {
      expect(result).toEqual({todos: [todo]});
    });
});

test('a successful server render', () => {
  const todoID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const todo = {id: todoID, title: 'Hello World', completed: false};
  const context = {
    db: {
      getTodos() {
        // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
        return [todo];
      },
      getTodo() {
        return todo;
      },
    },
  };

  const req: Request = {request: true} as any;
  const res: Response = {response: true} as any;
  const A1 = {a: 1};
  const A2 = {a: 2};
  const renderServerSide = bicycle.createServerRenderer<any, Object, Object>(
    () => context,
    (client, reqArg, resArg, a1, a2) => {
      expect(reqArg).toBe(req);
      expect(resArg).toBe(res);
      expect(a1).toBe(A1);
      expect(a2).toBe(A2);
      const resultA = client.queryCache({todos: {id: true}});
      if (resultA.loaded) {
        return client.queryCache({
          [`todoById(id:${JSON.stringify(
            (resultA.result as any).todos[0].id,
          )})`]: {
            id: true,
            title: true,
            completed: true,
          },
        });
      }
      return 'not loaded yet';
    },
  );

  return renderServerSide(req, res, A1, A2).then(
    ({serverPreparation, result}) => {
      expect(typeof serverPreparation).toBe('object');
      expect(typeof serverPreparation.s).toBe('string');
      expect(serverPreparation.q).toEqual({
        'todoById(id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")': {
          completed: true,
          id: true,
          title: true,
        },
        todos: {id: true},
      });
      expect(serverPreparation.c).toEqual({
        Root: {
          root: {
            ['todoById(id:"' + todoID + '")']: createNodeID('Todo', todoID),
            todos: [createNodeID('Todo', todoID)],
          },
        },
        Todo: {
          [todoID]: todo,
        },
      });
      expect(result).toEqual({
        result: {
          todoById: todo,
        },
        loaded: true,
        errors: [],
        errorDetails: [],
      });
    },
  );
});

test('a successful mutation with a result', () => {
  // 1. run a query
  // 2. check the inital value
  // 3. run a mutations
  // 4. check that the query result updates
  // 5. check the mutation updated successfully

  const app = express();
  const todo = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Hello World',
    completed: false,
  };
  const todos: any[] = [];
  app.use(
    '/bicycle',
    bicycle.createMiddleware((req, res) => {
      return {
        db: {
          getTodos() {
            // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
            return todos;
          },
          addTodo({title, completed}: any) {
            expect(title).toBe(todo.title);
            expect(completed).toBe(todo.completed);
            todos.push(todo);
            return Promise.resolve(todo.id);
          },
        },
      };
    }),
  );
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.statusCode = 500;
    res.end(err.stack);
  });
  return getPort()
    .then(port => ({server: app.listen(port), port}))
    .then(({server, port}) => {
      let resolveMutation: any, rejectMutation: any;
      const muationPromise = new Promise((resolve, reject) => {
        resolveMutation = resolve;
        rejectMutation = reject;
      });
      return new Promise((resolve, reject) => {
        const client = new BicycleClient(
          new NetworkLayer('http://localhost:' + port + '/bicycle'),
        );
        client.subscribeToNetworkErrors(reject);
        client.subscribeToMutationErrors(reject);
        let firstRun = true;
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
                if (firstRun) {
                  expect(result).toEqual({todos: []});
                  firstRun = false;
                  client
                    .update('Todo.addTodo', {
                      title: todo.title,
                      completed: todo.completed,
                    })
                    .then(result => {
                      expect(result).toEqual({id: todo.id});
                    })
                    .then(
                      () => {
                        resolveMutation();
                      },
                      err => {
                        reject(err);
                        rejectMutation(err);
                      },
                    );
                } else {
                  expect(result).toEqual({todos: [todo]});
                  server.close();
                  resolve();
                }
              }
            } catch (ex) {
              server.close();
              reject(ex);
            }
          },
        );
      }).then(() => muationPromise);
    });
});

test('a failing query', () => {
  allowErrors = true;
  const app = express();
  app.use(
    '/bicycle',
    bicycle.createMiddleware((req, res) => {
      return {
        db: {
          getTodos() {
            return Promise.reject(new Error('Whatever'));
          },
        },
      };
    }),
  );
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.statusCode = 500;
    res.end(err.stack);
  });
  return getPort()
    .then(port => ({server: app.listen(port), port}))
    .then(({server, port}) => {
      return new Promise((resolve, reject) => {
        const client = new BicycleClient(
          new NetworkLayer('http://localhost:' + port + '/bicycle'),
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
                expect(serverErrors[0].message).toBe(
                  'Whatever while getting Root(root).todos',
                );
                expect(result).toEqual({
                  todos: createErrorResult(
                    'Whatever while getting Root(root).todos',
                    {},
                  ),
                });
                expect(errors).toEqual([
                  'Whatever while getting Root(root).todos',
                ]);
                expect(errorDetails).toEqual([
                  createErrorResult(
                    'Whatever while getting Root(root).todos',
                    {},
                  ),
                ]);
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
});
