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
      resolve(
        {title, completed}: {title: string; completed: boolean},
        {db}: {db: any},
      ): {id: string} {
        return db.addTodo({title, completed}).then((id: string) => ({id}));
      },
    },
    toggleAll: {
      args: {checked: 'boolean'},
      resolve({checked}: {checked: boolean}, {db}: {db: any}) {
        return db.toggleAll(checked);
      },
    },
    toggle: {
      args: {id: 'id', checked: 'boolean'},
      resolve({id, checked}: {id: string; checked: boolean}, {db}: {db: any}) {
        return db.toggle(id, checked);
      },
    },
    destroy: {
      args: {id: 'id'},
      resolve({id}: {id: string}, {db}: {db: any}) {
        return db.destroy(id);
      },
    },
    save: {
      args: {id: 'id', title: 'string'},
      resolve({id, title}: {id: string; title: string}, {db}: {db: any}) {
        return db.setTitle(id, title);
      },
    },
    clearCompleted: {
      resolve(args: void, {db}: {db: any}) {
        return db.clearCompleted();
      },
    },
  },
};
