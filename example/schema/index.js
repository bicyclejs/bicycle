import loadSchema from '../../src/load-schema';
import {getTodo, getTodos} from '../data';
import {addTodo, toggleAll, toggle, destroy, setTitle, clearCompleted} from '../data';

const schema = {};
schema.scalars = [
  {
    name: 'id',
    validate(value) {
      console.log('id', value);
      // d4710923-1121-4a84-a148-85240fe8881a
      if (!/^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/.test(value)) {
        throw new Error('Invalid id');
      }
    },
  },
];
schema.objects = [
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
        type: {id: 'id'},
        args: {id: 'id', title: 'string', completed: 'boolean'},
        resolve({id, title, completed}, {user}) {
          return addTodo({id, title, completed}).then(id => ({id}));
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

export default loadSchema(schema);
