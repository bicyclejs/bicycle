// this file is to simulate a database

import Promise from  'promise';

const todos = [
  {id: 'blah', title: 'Build Bicycle', completed: false},
  {id: 'blob', title: 'Create an example', completed: false},
];
export function markComplete(id) {
  todos.filter(t => t.id === id).forEach(todo => todo.completed = true);
  return Promise.resolve(null);
}

export function getTodos() {
  return Promise.resolve(JSON.parse(JSON.stringify(todos)));
}

export function getTodo(id) {
  return Promise.resolve(JSON.parse(JSON.stringify(todos.filter(t => t.id === id)[0] || null)));
}
