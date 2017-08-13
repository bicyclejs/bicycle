import BicycleClient, {createNodeID} from '../../lib/client'; // in a real app, the path should be 'bicycle/client'

export default function TodoModel() {
  this.errors = [];
  this.todos = [];
  this.onChanges = [];

  this._client = new BicycleClient();
  this._subscription = this._client.subscribe({
    todos: {id: true, title: true, completed: true},
    obj: true,
    // intentional typo
    // todoos: true,
  }, (result, loaded, errors) => {
    if (loaded) { // ignore partial results
      console.dir(result);
      if (Array.isArray(result.todos)) {
        this.todos = result.todos;
      }
      this.errors = errors;
      this.inform();
    }
  });
}

TodoModel.prototype.subscribe = function (onChange) {
  this.onChanges.push(onChange);
};

TodoModel.prototype.inform = function () {
  this.onChanges.forEach(cb => cb());
};

TodoModel.prototype.addTodo = function (title) {
  this._client.update('Todo.addTodo', {title, completed: false}, (mutation, cache, optimistic) => {
    const id = optimistic('id');
    const todo = cache.getObject('Todo', id);
    todo.set('id', id);
    todo.set('title', mutation.args.title);
    todo.set('completed', mutation.args.completed);

    const todos = cache.get('todos') || [];
    cache.set('todos', [todo].concat(todos));
  });
};

TodoModel.prototype.toggleAll = function (checked) {
  this._client.update('Todo.toggleAll', {checked}, (mutation, cache) => {
    const todos = cache.get('todos') || [];
    todos.forEach(todo => {
      todo.set('completed', checked);
    });
  });
};

TodoModel.prototype.toggle = function (todoToToggle) {
  this._client.update('Todo.toggle', {id: todoToToggle.id, checked: !todoToToggle.completed}, (mutation, cache) => {
    cache.getObject('Todo', mutation.args.id).set('completed', mutation.args.checked);
  });
};

TodoModel.prototype.destroy = function (todo) {
  this._client.update('Todo.destroy', {id: todo.id}, (mutation, cache) => {
    const todos = cache.get('todos') || [];
    cache.set('todos', todos.filter(t => t.get('id') !== mutation.args.id));
  });
};

TodoModel.prototype.save = function (todoToSave, text) {
  this._client.update('Todo.save', {id: todoToSave.id, title: text}, (mutation, cache) => {
    cache.getObject('Todo', mutation.args.id).set('title', mutation.args.title);
  });
};

TodoModel.prototype.clearCompleted = function () {
  this._client.update('Todo.clearCompleted', undefined, (mutation, cache) => {
    const todos = cache.get('todos') || [];
    cache.set('todos', todos.filter(t => !t.get('completed')));
  });
};
