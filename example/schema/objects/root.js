import {getTodo, getTodos} from '../../data';

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
