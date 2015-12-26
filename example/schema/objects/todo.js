import {markComplete} from '../../data';

export default {
  name: 'Todo',
  fields: {
    title: 'string',
    completed: 'boolean',
  },
  mutations: {
    markComplete: {
      resolve(todoID, args, {user}) {
        return markComplete(todoID);
      },
    },
  },
};
