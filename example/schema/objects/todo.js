import {addTodo, toggleAll, toggle, destroy, setTitle, clearCompleted} from '../../data';

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
      resolve({title, completed}, {user}) {
        return addTodo({title, completed}).then(id => ({id}));
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
}
