export default {
  name: 'Root',
  fields: {
    todoById: {
      type: 'Todo',
      args: {id: 'string'},
      resolve(root, {id}, {db}) {
        return db.getTodo(id);
      },
    },
    todos: {
      type: 'Todo[]',
      resolve(root, args, {db}) {
        return db.getTodos();
      },
    },
  },
};
