import {getTodo, getTodos} from '../../data';

export default {
  name: 'root',
  fields: {
    todoById: {
      type: 'Todo',
      args: {id: 'id'},
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
