export default {
  name: 'Todo',
  fields: {
    id: 'id',
    title: 'string',
    completed: 'boolean',
  },
  mutations: {
    addTodo: {
      type: {id: 'id'},
      args: {title: 'string', completed: 'boolean'},
      resolve({title, completed}, {db}) {
        return db.addTodo({title, completed}).then(id => ({id}));
      },
    },
    toggleAll: {
      args: {checked: 'boolean'},
      resolve({checked}, {db}) {
        return db.toggleAll(checked);
      },
    },
    toggle: {
      args: {id: 'id', checked: 'boolean'},
      resolve({id, checked}, {db}) {
        return db.toggle(id, checked);
      },
    },
    destroy: {
      args: {id: 'id'},
      resolve({id}, {db}) {
        return db.destroy(id);
      },
    },
    save: {
      args: {id: 'id', title: 'string'},
      resolve({id, title}, {db}) {
        return db.setTitle(id, title);
      },
    },
    clearCompleted: {
      resolve(args, {db}) {
        return db.clearCompleted();
      },
    },
  },
};
