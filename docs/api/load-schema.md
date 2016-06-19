# bicycle/load-schema

This module is used to take your raw schema and load it into the schema format used by all of bicycle's other methods.

## Usage

You can call the `loadSchema` function directly to load a schema that you already have in an object.

```js
import loadSchema from 'bicycle/load-schema';

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
