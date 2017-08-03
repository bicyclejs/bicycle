export default {
  name: 'Root',
  fields: {
    todoById: {
      type: 'Todo',
      args: {id: 'string'},
      resolve(root: {}, {id}: {id: string}, {db}: {db: any}) {
        return db.getTodo(id);
      },
    },
    todos: {
      type: 'Todo[]',
      resolve(root: {}, args: void, {db}: {db: any}) {
        return db.getTodos();
      },
    },
  },
};
