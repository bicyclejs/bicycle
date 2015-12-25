export default {
  name: 'Query',
  fields: {
    todoById: {
      type: 'Todo',
      args: {id: 'id'},
      resolve(q, {id}) {
        switch (id) {
          case 'blah':
            return {id: 'blah', title: 'Build Bicycle', completed: false};
          case 'blob':
            return {id: 'blob', title: 'Create an example', completed: false};
          default:
            return null;
        }
      },
    },
    todos: {
      type: 'Todo[]',
      resolve() {
        return [
          {id: 'blah', title: 'Build Bicycle', completed: false},
          {id: 'blob', title: 'Create an example', completed: false},
        ];
      },
    },
  },
};
