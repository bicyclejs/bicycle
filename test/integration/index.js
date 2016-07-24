import assert from 'assert';
import test from 'testit';

import express from 'express';
import BicycleClient, {NetworkLayer} from 'bicycle/client';
import {loadSchemaFromFiles, createBicycleMiddleware} from 'bicycle/server';
import MemoryStore from 'bicycle/sessions/memory';

const schema = loadSchemaFromFiles(__dirname + '/schema');
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
      (result, loaded, errors) => {
        try {
          assert.strictEqual(typeof result, 'object');
          assert.strictEqual(typeof loaded, 'boolean');
          assert(Array.isArray(errors));
          if (errors.length) {
            throw new Error(errors[0]);
          }
          if (loaded) {
            assert.deepEqual(
              result,
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