---
id: getting-started-js
title: Getting Started - JavaScript
sidebar_label: JavaScript
---

A bicycle setup consists of three parts:

1. A schema - this defines what data exists and how it is accessed and updated
2. A server - this exposes the schema, and establishes the "context" of the query, such as which user is running the query
3. A client - this connects to the server and runs queries and updates

## Schema

Inside you're project's directory, create a folder called "bicycle-schema". Within "bicycle-schema", create two folders: "objects" and "scalars". You should have the following structure:

```
bicycle-schema/
├── objects/
└── scalars/
```

### Schema Objects

In `bicycle-schema/objects/` create a new file, `Root.js`:

```js
import {getTodo, getTodos} from 'todo-memory-store';

export default {
  name: 'Root',
  fields: {
    todoById: {
      type: 'Todo',
      args: {id: 'string'},
      resolve(_root, {id}, {user}) {
        return getTodo(id);
      },
    },
    todos: {
      type: 'Todo[]',
      resolve(_root, _args, {user}) {
        return getTodos();
      },
    },
  },
};
```

All queries start from the `Root` object, so your bicycle schema must always have an object called `Root`. The object consists of a number of "fields", each of which has a return type and a resolver function, and can optionally take args.


In `bicycle-schema/objects/` create a new file, `Todo.js`:

```js
import {addTodo, toggle, setTitle, destroy} from 'todo-memory-store';

export default {
  name: 'Todo',
  fields: {
    id: 'id',
    title: 'string',
    completed: 'boolean',
    notCompleted: {
      type: 'boolean',
      resolve(todo, _args, {user}) {
        return !todo.completed;
      },
    }
  },
  mutations: {
    addTodo: {
      type: {id: 'id'},
      args: {title: 'string', completed: 'boolean'},
      resolve({title, completed}, {user}) {
        return addTodo({title, completed}).then(id => ({id}));
      },
    },
    toggle: {
      args: {id: 'id', completed: 'boolean'},
      resolve({id, completed}, {user}) {
        return toggle(id, completed);
      },
    },
    setTitle: {
      args: {id: 'id', title: 'string'},
      resolve({id, title}, {user}) {
        return setTitle(id, title);
      },
    },
    destroy: {
      args: {id: 'id'},
      resolve({id}, {user}) {
        return destroy(id);
      },
    },
  },
};
```

This object has `fields`, just like with the `Root` object. If the object has the field built in, we don't need to supply a `resolve` function and can just specify the type.

We can also specify mutations, which are methods you that can update the data. After a mutation is run, bicycle will automatically re-query the data to find out what changed. Mutations can also return data. Data returned from a mutation is available to the caller, but is not subscribed to.

> Appart from the `Root`, all objects must have a property called `id`, that is either a `string` or a `number`. This is used to normalize the data, so that only one copy of each object exists, even if they appear multiple times in the graph of results.

### Schema Scalars

Bicycle comes with the following built in scalar types:

 - `boolean` - either `true` or `false`
 - `string` - any string of text, e.g. `'Hello World'`
 - `number` - any valid JavaScript number, e.g. `0`, `42` or `-4.5`
 - `void` - the JavaScript value `undefined`
 - `null` - the JavaScript value `null`
 - `any` - can be literally any JSON value, including objects, arrays etc. No validation will be provided.

 We are going to add an `id` type.

In `bicycle-schema/scalars/` create a new file, `id.js`:

```js
export default {
  name: 'id',
  baseType: 'string',
  validate(value) {
    // validate that it matches the format of the values
    //returned by uuid() in todo-memory-store
    return /^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/.test(value);
  },
};
```

Your directory structure should now be;

```
bicycle-schema/
├── objects/
│   ├── Root.js
│   └── Todo.js
└── scalars/
    └── id.js
```

## Server

Create a file called `server.js`

```js
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
import BicycleServer from 'bicycle/server';

const bicycle = new BicycleServer(__dirname + '/bicycle-schema');

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

Add an `index.html` file:

```html
<div>Open dev tools to see results of bicycle queries</div>
<script src="/client.js"></script>
```

Add a `client.js` file:

```js
import BicycleClient from 'bicycle/client';

// defaults to using the `/bicycle` path
const client = new BicycleClient();

const subscription = this._client.subscribe({
  todos: {id: true, title: true, completed: true},
}, (result, loaded, errors) => {
  if (loaded) { // ignore partial results
    // this will be called each time the list
    // of todo items changes
    console.log(result);
  }
});

async function run() {
  const {id} = await client.update('Todo.addTodo', {
    title: 'Hello World',
    completed: false,
  });

  await client.update('Todo.toggle', {id, completed: true},
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

## React

To use with React, you can use `react-bicycle`.

Update `index.html`:

```html
<div id="app"></div>
<script src="/client.js"></script>
```

Update `client.js`:

```js
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import BicycleClient from 'bicycle/client';
import {BicycleProvider, useClient, useQuery} from 'react-bicycle';

const client = new BicycleClient();

function Todo({todo}) {
  const client = useClient();
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={e => client.update('Todo.toggle', {
          id: todo.id,
          completed: e.target.checked
        })}
      />
      {todo.title}
    </li>
  )
}
function App() {
  const client = useClient();
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const query = useQuery({todos: {id: true, title: true, completed: true}});
  return (
    <>
      {
        !query.loaded
          ?  query.render() // render loading/error indicator
          : (
            <ul>
              {query.result.todos.map(todo => <Todo key={todo.id} todo={todo} />)}
            </ul>
          )
      }
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (submitting || newTitle === '') return;
          setSubmitting(true);
          try {
            await client.update('Todo.addTodo', {title: newTitle, completed: false});
          } finally {
            setSubmitting(false);
          }
          setNewTitle('');
        }}
      >
        <input disabled={submitting} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <button disabled={submitting || newTitle === ''} type="submit">Add Todo</button>
      </form>
    </>
  )
}

ReactDOM.render(
  <BicycleProvider client={client}>
    <App/>
  </BicycleProvider>,
  document.getElementById('app'),
);
```