// @flow

// TODO: don't run this until all the other tests have passed

import express from 'express';
import getPort from 'get-port';
import BicycleClient, {NetworkLayer} from '../client';
import prepareServer from '../server-rendering';
import {
  loadSchemaFromFiles,
  createBicycleMiddleware,
  runQuery,
  onBicycleError,
  silenceDefaultBicycleErrorReporting,
} from '../server';
import MemoryStore from '../sessions/memory';

let allowErrors = false;
const serverErrors = [];
onBicycleError(err => {
  if (allowErrors) {
    serverErrors.push(err);
  } else {
    console.error(err.stack);
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
  return getPort().then(
    port => ({server: app.listen(port), port}),
  ).then(({server, port}) => {
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

  // sessions expire after just 1 second for testing
  const sessionStore = new MemoryStore(1000);

  const A1 = {};
  const A2 = {};
  const renderServerSide = prepareServer(
    schema,
    sessionStore,
    (client, a1, a2) => {
      expect(a1).toBe(A1);
      expect(a2).toBe(A2);
      const resultA = client.queryCache({todos: {id: true}});
      if (resultA.loaded) {
        return client.queryCache({
          [`todoById(id:${JSON.stringify(resultA.result.todos[0].id)})`]: {
            id: true,
            title: true,
            completed: true,
          },
        });
      }
      return 'not loaded yet';
    }
  );

  return renderServerSide(context, A1, A2).then(({serverPreparation, result}) => {
    expect(typeof serverPreparation).toBe('object');
    expect(typeof serverPreparation.s).toBe('string');
    expect(serverPreparation.q).toEqual({
      "todoById(id:\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\")": {completed: true, id: true, title: true},
      "todos": {id: true},
    });
    expect(serverPreparation.c).toEqual({
      root: {
        ['todoById(id:"' + todoID + '")']: 'Todo:' + todoID,
        'todos': ['Todo:' + todoID],
      },
      ['Todo:' + todoID]: todo,
    });
    expect(result).toEqual({
      result: {
        todoById: todo,
      },
      loaded: true,
      errors: [],
      errorDetails: [],
    });
  });
});

test('a successful mutation with a result', () => {
  // 1. run a query
  // 2. check the inital value
  // 3. run a mutations
  // 4. check that the query result updates
  // 5. check the mutation updated successfully

  const app = express();
  // sessions expire after just 1 second for testing
  const sessionStore = new MemoryStore(1000);
  const todo = {id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', title: 'Hello World', completed: false};
  const todos = [];
  app.use('/bicycle', createBicycleMiddleware(schema, sessionStore, req => {
    return {
      db: {
        getTodos() {
          // ^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$
          return todos;
        },
        addTodo({title, completed}) {
          expect(title).toBe(todo.title);
          expect(completed).toBe(todo.completed);
          todos.push(todo);
          return Promise.resolve(todo.id);
        },
      },
    };
  }));
  return getPort().then(
    port => ({server: app.listen(port), port}),
  ).then(({server, port}) => {
    let resolveMutation, rejectMutation;
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
                expect(
                  result,
                ).toEqual(
                  {todos: []}
                );
                firstRun = false;
                client.update('Todo.addTodo', {title: todo.title, completed: todo.completed}).then(result => {
                  expect(result).toEqual({id: todo.id});
                }).done(() => {
                  resolveMutation();
                }, err => {
                  reject(err);
                  rejectMutation(err);
                });
              } else {
                expect(
                  result,
                ).toEqual(
                  {todos: [todo]}
                );
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
  return getPort().then(
    port => ({server: app.listen(port), port}),
  ).then(({server, port}) => {
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
});
