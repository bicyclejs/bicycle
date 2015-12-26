// this file is to simulate a database

import Promise from 'promise';

const LATENCY = 10000;

let todos = [
  {id: 'blah', title: 'Build Bicycle', completed: false},
  {id: 'blob', title: 'Create an example', completed: false},
];

export function addTodo(todo) {
  todos.unshift(todo);
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function toggleAll(checked) {
  todos.forEach(todo => {
    todo.completed = checked;
  });
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function toggle(id, checked) {
  todos.filter(t => t.id === id).forEach(todo => todo.completed = checked);
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function destroy(id) {
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].id === id) {
      todos.splice(i, 1);
    }
  }
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function setTitle(id, title) {
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].id === id) {
      todos[i].title = title;
    }
  }
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  return new Promise((resolve) => { setTimeout(resolve, LATENCY); });
}

export function getTodos() {
  return Promise.resolve(JSON.parse(JSON.stringify(todos)));
}

export function getTodo(id) {
  return Promise.resolve(JSON.parse(JSON.stringify(todos.filter(t => t.id === id)[0] || null)));
}
