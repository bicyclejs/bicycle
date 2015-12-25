import {uuid} from './utils.js';

export default function TodoModel() {
  this.todos = [];
  this.onChanges = [];
}

TodoModel.prototype.subscribe = function (onChange) {
  this.onChanges.push(onChange);
};

TodoModel.prototype.inform = function () {
  this.onChanges.forEach(cb => cb());
};

TodoModel.prototype.addTodo = function (title) {
  this.todos = this.todos.concat({
    id: uuid(),
    title,
    completed: false,
  });

  this.inform();
};

TodoModel.prototype.toggleAll = function (checked) {
  // Note: it's usually better to use immutable data structures since they're
  // easier to reason about and React works very well with them. That's why
  // we use map() and filter() everywhere instead of mutating the array or
  // to-do items themselves.
  this.todos = this.todos.map((todo) => {
    return {...todo, completed: checked};
  });

  this.inform();
};

TodoModel.prototype.toggle = function (todoToToggle) {
  this.todos = this.todos.map(todo => {
    return todo !== todoToToggle ?
      todo :
      {...todo, completed: !todo.completed};
  });

  this.inform();
};

TodoModel.prototype.destroy = function (todo) {
  this.todos = this.todos.filter(candidate => candidate !== todo);

  this.inform();
};

TodoModel.prototype.save = function (todoToSave, text) {
  this.todos = this.todos.map(todo => {
    return todo !== todoToSave ? todo : {...todo, title: text};
  });

  this.inform();
};

TodoModel.prototype.clearCompleted = function () {
  this.todos = this.todos.filter(todo => !todo.completed);

  this.inform();
};

function BicycleStore() {
}
BicycleStore.prototype.request = function (query) {
};
BicycleStore.prototype.subscribe = function (query, fn) {
};
