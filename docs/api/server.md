# bicycle

## `loadSchema` / `loadSchemaFromFiles`

This module is used to take your raw schema and load it into the schema format used by all of bicycle's other methods.

You can call the `loadSchema` function directly to load a schema that you already have in an object.

```js
import {loadSchema} from 'bicycle';

const schema = loadSchema({
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
});
```

Alternatively, if your schema is already split into `'objects'` and `'scalars'` folders with each object/scalar
represented as a module in one of those folders, you can use `loadSchemaFromFiles`:

```js
import {loadSchemaFromFiles} from 'bicycle/load-schema';

const schema = loadSchemaFromFiles(__dirname);
```

## `createBicycleMiddleware`

Once you have a schema, you can expose it on a path using `createBicycleMiddleware`.  By default this responds to
messages sent as a JSON body in an http POST.  Conveniently, this is what the default `NetworkLayer` implementation
does too.

```js
import {createBicycleMiddleware} from 'bicycle';
import MemoryStore from 'bicycle/sessions/memory';

const sessionStore = new MemoryStore();
app.use('/bicycle', createBicycleMiddleware(schema, sessionStore, req => ({user: req.user})));
```

I recommend serving it on the path `/bicycle` as this is the default, but you can pass options to `NetworkLayer` to
select a different path if you want.

### args

 - schema - The schema returned by a call to `loadSchema` or `loadSchemaFromFiles`
 - sessionStore - An object implementing the session store API.  See `bicycle/sessions/memory` for an example
 - getContext - A function that takes a request and returns the "context" object used for queries and mutations

## `createServerRenderer`

If you want your application to render on the server side (e.g. for users without JavaScript enabled) you can use
`createServerRenderer`

```js
import {createServerRenderer} from 'bicycle';

const serverRenderer = createServerRenderer(
  schema,
  sessionStore, // make sure this is the same instance you pass to `createBicycleMiddleware`
  (client, ...args) => {
    // you can render your app here, querying from "client"
    // your app will be rendered multiple times until all the data has been loaded
    // only `client.queryCache` is implemented.
    const {result, loaded, errors} = client.queryCache({{todos: {id: true, title: true, completed: true}}});
    if (loaded && !errors.length) {
      return renderTemplate(result);
    }
  }
);

// the first argument is the "context", subsequent arguments are passed through to your rendering function.
serverRenderer({user: 'my user'}, ...args).done(({serverPreparation, result}) => {
  console.log('server renderer result:');
  console.log(result);
  // serverPreparation can be used to rehydrate the data on the client
});
```

## `runQuery`

`(schema: Schema, query: Object, context: Object) => Promise<Object>`

> Docs TODO

## `runMutation`

`(schema: Schema, mutation: {name: string, args: Object}, context: Object) => Promise<{success: boolean, value: any}`>

> Docs TODO

## `handleMessage`

`(schema: Object, sessionStore: SessionStore, message: Message, context: Object) => Promise<Result>`

> Docs TODO
