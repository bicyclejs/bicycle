# bicycle

A data synchronisation library for JavaScript

[![Build Status](https://img.shields.io/travis/bicyclejs/bicycle/master.svg)](https://travis-ci.org/bicyclejs/bicycle)
[![Dependency Status](https://img.shields.io/david/bicyclejs/bicycle.svg)](https://david-dm.org/bicyclejs/bicycle)
[![NPM version](https://img.shields.io/npm/v/bicycle.svg)](https://www.npmjs.org/package/bicycle)

## Installation

    npm install bicycle

## Usage

### Client

```js
import BicycleClient from 'bicycle/lib/client';

const client = new BicycleClient();

const subscription = client.subscribe(
  {todos: {id: true, title: true, completed: true}},
  (result, loaded) => {
    // note that if `loaded` is `false`, `result` is a partial result
    console.dir(result.todos);
  },
);

// to dispose of the subscription:
subscription.unsubscribe();

// Use `update` to trigger mutations on the server. Any relevant subscriptions are updated automatically
client.update('Todo.toggle', {id: todoToToggle.id, checked: !todoToToggle.completed}).done(
  () => console.log('updated!'),
);
```

Queries can also take parameters and have aliases, e.g.

```js
const subscription = client.subscribe(
  {'todosById(id: "whatever") as todo': {id: true, title: true, completed: true}},
  (result, loaded) => {
    console.dir(result.todo);
  },
);
```

### Server

```js
import express from 'express';
import BicycleServer from 'bicycle/server';

const app = express();

// other routes etc. here

// define the schema.
// in a real app you'd want to split schema definition across multiple files
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

const bicycle = new BicycleServer(schema);

// createMiddleware takes a function that returns the context given a request
// this allows you to only expose information the user is allowed to see
app.use('/bicycle', bicycle.createMiddleware(req => ({user: req.user})));

app.listen(3000);
```

#### schema

Your schema consists of a collection of type definitions.  Type definitions can be:

 - objects (a collection of fields, with an ID)
 - scalars (there are built in values for `'string'`, `'number'` and `'boolean'`, but you may wish to add your own)
 - enums (these take a value from a predetermined set)

##### Root Object

You must always define an ObjectType called `'Root'`.  This type is a singleton and is the entry point for all queries.

e.g.

```js
export default {
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
};
```

##### Object types

Object types have the following properties:

 - id (`Function`) - A function that takes an object of this type and returns a globally unique id, defaults to `obj => TypeName + obj.id`
 - name (`string`, required) - The name of your Object Type
 - description (`string`) - An optional string that may be useful for generating automated documentation
 - fields (`Map<string, Field>`) - An object mapping field names onto field definitions.
 - mutations (`Map<string, Mutation>`) - An object mapping field names onto mutation definitions.

Fields can have:

 - type (`typeString`, required) - The type of the field
 - args (`Map<string, typeString>`) - The type of any arguments the field takes
 - description (`string`) - An optional string that may be useful for generating automated documentation
 - resolve (`Function`) - A function that takes the object, the args (that have been type checked) and the context and returns the value of the field.  Defaults to `obj => obj.fieldName`

## License

  MIT
