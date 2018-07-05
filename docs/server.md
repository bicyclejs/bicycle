---
id: server
title: BicycleServer
sidebar_label: Server
---

Define a schema by creating a `'schema'` folder and putting two folders in it called `'objects'` and `'scalars'` respectively.  In the `'objects'` folder, create a file called `root.js`.  In that file, put something like:

```js
export default {
  name: 'Root',
  fields: {
    // ...your fields here...
  },
};
```

Then you can construct a bicycle server instance like:

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';

const options = {};

const bicycle = new BicycleServer(schema, options);
```

> You can see an example of this directory structure in the "example/schema" folder of this repo.

### Inline schema

You can, alternatively, represent the schema as an object with an array of `'objects'` and an optional array of `'scalars'`:

```js
import BicycleServer from 'bicycle/server';

const schema = {
  objects: [
    {
      name: 'Root',
      fields: {
        todoById: {
          type: 'Todo',
          args: {id: 'string'},
          resolve(root, {id}, {user}) {
            return getTodo(id);
          },
        },
        todos: {
          type: 'Todo[]',
          resolve(root, args, {user}) {
            return getTodos();
          },
        },
      },
    },

    {
      name: 'Todo',
      fields: {
        id: 'id',
        title: 'string',
        completed: 'boolean',
      },
      mutations: {
        addTodo: {
          args: {id: 'id', title: 'string', completed: 'boolean'},
          resolve({id, title, completed}, {user}) {
            return addTodo({id, title, completed});
          },
        },
        toggleAll: {
          args: {checked: 'boolean'},
          resolve({checked}) {
            return toggleAll(checked);
          },
        },
        toggle: {
          args: {id: 'id', checked: 'boolean'},
          resolve({id, checked}, {user}) {
            return toggle(id, checked);
          },
        },
        destroy: {
          args: {id: 'id'},
          resolve({id}, {user}) {
            return destroy(id);
          },
        },
        save: {
          args: {id: 'id', title: 'string'},
          resolve({id, title}, {user}) {
            return setTitle(id, title);
          },
        },
        clearCompleted: {
          resolve(args, {user}) {
            return clearCompleted();
          },
        },
      },
    },
  ];
};

const options = {};

const bicycle = new BicycleServer(schema, options);
```

### options

 - `sessionStore` (default: MemoryStore) - lets you pass a custom session store (see sessions).
 - `disableDefaultLogging` (default: `false`) - silence error logging
 - `onError` (`({error: Error}) => mixed`) - called on errors
 - `onMutationStart` (`({mutation: {+method: string, +args: Object}}) => mixed`) - called before each mutation. The mutation will wait for any promise returned by this function.
 - `onMutationEnd` (`({mutation: {+method: string, +args: Object}, result: MutationResult}) => mixed`) - called after each mutation. The next mutation/query will wait for any promise returned by this function.
  - `onQueryStart` (`({query: Object}) => mixed`) - called before each query
  - `onQueryEnd` (`({query: Object, cacheResult: Object}) => mixed`) - called after each query

## `createMiddleware`

Once you have a schema, you can expose it on a path using `createMiddleware`.  By default this responds to
messages sent as a JSON body in an http POST.  Conveniently, this is what the default `NetworkLayer` implementation
does too.

```js
import express from 'express';
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

const app = express();

app.use('/bicycle', bicycle.createMiddleware(req => ({user: req.user})));

app.listen(process.env.PORT || 3000);
```

I recommend serving it on the path `/bicycle` as this is the default, but you can pass options to `NetworkLayer` to
select a different path if you want.

### args

 - getContext - A function that takes a request and returns the "context" object used for queries and mutations

## `createServerRenderer`

If you want your application to render on the server side (e.g. for users without JavaScript enabled) you can use
`createServerRenderer`

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

const serverRenderer = bicycle.createServerRenderer((client, ...args) => {
  // you can render your app here, querying from "client"
  // your app will be rendered multiple times until all the data has been loaded
  // only `client.queryCache` is implemented.
  const {result, loaded, errors} = client.queryCache({{todos: {id: true, title: true, completed: true}}});
  if (loaded && !errors.length) {
    return renderTemplate(result);
  }
});

// the first argument is the "context", subsequent arguments are passed through to your rendering function.
serverRenderer({user: 'my user'}, ...args).done(({serverPreparation, result}) => {
  console.log('server renderer result:');
  console.log(result);
  // serverPreparation can be used to rehydrate the data on the client
});
```

## `runQuery`

If you need to run a query on the server side, you can directly call `runQuery`.  You will need to pass it a context.

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

bicycle.runQuery({
  todos: {id: true, title: true, completed: true},
}, context).done(result => {
  console.log(result.todos);
});
```

## `runMutation`

If you need to run a mutation on the server side, you can directly call `runMutation`.  You will need to pass it a context.

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

bicycle.runMutation('Todo.toggle', {id, checked: true}, context).done(() => {
  console.log('Todo complete');
});
```

## `handleMessage`

If you've replaced the network layer with a custom network layer (only for really advanced use cases) you can use
`handleMessage` instead of `createBicycleMiddleware`.

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

class MockNetworkLayer {
  constructor(bicycle, context) {
    this._bicycle = bicycle;
    this._context = context;
  }
  send(message) {
    return this._bicycle.handleMessage(message, this._context);
  }
}
```
