---
id: getting-started-ts
title: Getting Started - TypeScript
sidebar_label: TypeScript
---

A bicycle setup consists of three parts:

1. A schema - this defines what data exists and how it is accessed and updated
2. A server - this exposes the schema, and establishes the "context" of the query, such as which user is running the query
3. A client - this connects to the server and runs queries and updates

## Schema

Inside you're project's directory, create a folder called "src/bicycle-schema".


### Schema Objects

In `src/bicycle-schema/` create a new file, `Root.ts`:

```ts
import {getTodo, getTodos} from 'todo-memory-store';
import BaseObject from 'bicycle/BaseObject';
import ID from './ID';
import Todo from './Todo';

export default class Root extends BaseObject<{}> {
  $auth = {
    public: ['todos', 'todoById'],
  };

  async todos(args: void, ctx: {user: {id: number}}): Promise<Todo[]> {
    return (await getTodos()).map((t: any) => new Todo(t));
  }

  async todoById({id}: {id: ID}, ctx: {user: {id: number}}): Promise<Todo> {
    return new Todo(await getTodo(id));
  }
}
```

All queries start from the `Root` object, so your bicycle schema must always have an object called `Root`. The object consists of a number of "fields". These are methods on the class. To indicate to bicycle that the object is queryable, it must extend `BicycleObject`. To expose a method as a queryable field, it must be included in the `$auth.public` array.


In `src/bicycle-schema/` create a new file, `Todo.ts`:

```ts
import {addTodo, toggle, setTitle, destroy} from 'todo-memory-store';
import BaseObject from 'bicycle/BaseObject';
import ID from './ID';

export default class Todo extends BaseObject<{
  id: ID;
  title: string;
  completed: boolean;
}> {
  $auth = {
    public: ['id', 'title', 'completed', 'notCompleted'],
  };
  notCompleted(_args: void, ctx: {user: {id: number}}): boolean {
    return !this.data.completed;
  }

  static $auth = {
    public: [
      'addTodo',
      'toggleAll',
      'toggle',
      'destroy',
      'save',
      'clearCompleted',
    ],
  };

  static async addTodo({
    title,
    completed,
  }: {
    title: string;
    completed: boolean;
  }): Promise<{id: ID}> {
    return {id: await addTodo({title, completed})};
  }

  static async toggle({id, checked}: {id: ID; checked: boolean}) {
    await toggle(id, checked);
  }

  static async setTitle({id, title}: {id: ID; title: string}) {
    await setTitle(id, title);
  }

  static async destroy({id}: {id: ID}) {
    await destroy(id);
  }
}
```

Other than the `Root` object, all objects have a raw record value called `this.data`. You specify the type of that record within `<...>` on the `extend BicycleObject<...>`. You can expose any field on the raw data object, just by putting it in the `$auth.public` array.

To include calculated fields, add methods, just like on the `Root` object.

We can also specify `static` mutations, which are methods you that can update the data. After a mutation is run, bicycle will automatically re-query the data to find out what changed. Mutations can also return data. Data returned from a mutation is available to the caller, but is not subscribed to.

> Appart from the `Root`, all objects must have a property called `id`, that is either a `string` or a `number`. This is used to normalize the data, so that only one copy of each object exists, even if they appear multiple times in the graph of results.

### Schema Scalars

Bicycle can validate most of the built in TypeScript data types, including objects and enums, as long as they can be represented in JSON. We call these values "Scalars". You can define your own custom runtime validation by adding an "opaque type". We are going to add an `id` type.

In `src/bicycle-schema/` create a new file, `ID.ts`:

```ts
export const enum IDBrand {}
type ID = IDBrand & string;
export function validateID(value: string): value is ID {
  // validate that it matches the format of the values
  //returned by uuid() in todo-memory-store
  return /^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/.test(value);
}
export default ID;
```

## Generate Runtime

Run `npx ts-bicycle src/bicycle-schema src/bicycle`. This will generate a new folder called `src/bicycle` with a typed server and a typed client, based on the Objects and Scalars in `src/bicycle-schema`.

## Server

Create a file called `server.ts`

```js
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
import BicycleServer from './bicycle/server';

const bicycle = new BicycleServer();

const app = express();

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/client.js', browserify(__dirname + '/client.js', {transform: [babelify]}));

// req is the express web request
// {id: 42} will be the "user" value in the bicycle schema
app.use('/bicycle', bicycle.createMiddleware(req => ({user: {id: 42}})));

app.listen(3000);
```

This serves up our client app as `client.js` and `index.html`. This example assumes you are using `browserify` and `babel` to compile your client side code. You can use webpack if you prefer, browserify just requries less config to show in the demo.

It also adds a `/bicycle` endpoint that can be used for bicycle queries.

> N.B. If you use cookies to store sessions for authentication you **must** add [CSRF protection](https://www.atauthentication.com/docs/csrf-protection.html) or your app will be insecure.

## Client

Add an `src/index.html` file:

```html
<div>Open dev tools to see results of bicycle queries</div>
<script src="/client.js"></script>
```

Add a `src/client.ts` file:

```ts
import BicycleClient from './bicycle/client';
import * as q from './bicycle/query';

// defaults to using the `/bicycle` path
const client = new BicycleClient();

const subscription = this._client.subscribe(
  q.Root.todos(q.Todo.id.title.completed),
  (result, loaded, errors) => {
    if (loaded) { // ignore partial results
      // this will be called each time the list
      // of todo items changes
      console.log(result);
    }
  },
);

async function run() {
  const {id} = await client.update(Todo.addTodo({
    title: 'Hello World',
    completed: false,
  }));

  await client.update(Todo.toggle({id, completed: true}),
    (mutation, cache) => {
      // this function lets you update the cache optimistically
      // its effects are reverted once the mutation has completed
      // or failed
      cache
        .getObject('Todo', mutation.args.id)
        .set('completed', mutation.args.completed);
    }
  );

  // stop listening for updates from the server
  subscription.unsubscribe();
}

setTimeout(() => {
  run().catch(ex => console.error(ex.stack || ex.message || ex));
}, 1000);
```