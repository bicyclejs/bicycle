import React from 'react';
import ReactDOM from 'react-dom';
import TodoModel from './todo-model';
import TodoFooter from './todo-footer';
import TodoItem from './todo-item';
import {ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS} from './constants.js';

const ENTER_KEY = 13;

const TodoApp = React.createClass({
  getInitialState() {
    return {
      editing: null,
      newTodo: '',
    };
  },

  handleChange(event) {
    this.setState({newTodo: event.target.value});
  },

  handleNewTodoKeyDown(event) {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }

    event.preventDefault();

    const val = this.state.newTodo.trim();

    if (val) {
      this.props.model.addTodo(val);
      this.setState({newTodo: ''});
    }
  },

  toggleAll(event) {
    const checked = event.target.checked;
    this.props.model.toggleAll(checked);
  },

  toggle(todoToToggle) {
    this.props.model.toggle(todoToToggle);
  },

  destroy(todo) {
    this.props.model.destroy(todo);
  },

  edit(todo) {
    this.setState({editing: todo.id});
  },

  save(todoToSave, text) {
    this.props.model.save(todoToSave, text);
    this.setState({editing: null});
  },

  cancel() {
    this.setState({editing: null});
  },

  clearCompleted() {
    this.props.model.clearCompleted();
  },

  componentDidMount() {

  },

  render() {
    let nowShowing;
    switch (location.hash) {
      case '#/completed':
        nowShowing = COMPLETED_TODOS;
        break;
      case '#/active':
        nowShowing = ACTIVE_TODOS;
        break;
      default:
        nowShowing = ALL_TODOS;
        break;
    }
    let footer;
    let main;
    const todos = this.props.model.todos;

    const shownTodos = todos.filter((todo) => {
      switch (nowShowing) {
        case ACTIVE_TODOS:
          return !todo.completed;
        case COMPLETED_TODOS:
          return todo.completed;
        default:
          return true;
      }
    }, this);

    const todoItems = shownTodos.map(function (todo) {
      return (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={this.toggle.bind(this, todo)}
          onDestroy={this.destroy.bind(this, todo)}
          onEdit={this.edit.bind(this, todo)}
          editing={this.state.editing === todo.id}
          onSave={this.save.bind(this, todo)}
          onCancel={this.cancel}
        />
      );
    }, this);

    const activeTodoCount = todos.reduce((accum, todo) => {
      return todo.completed ? accum : accum + 1;
    }, 0);

    const completedCount = todos.length - activeTodoCount;

    if (activeTodoCount || completedCount) {
      footer =
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          nowShowing={nowShowing}
          onClearCompleted={this.clearCompleted}
        />;
    }

    if (todos.length) {
      main = (
        <section className="main">
          <input
            className="toggle-all"
            type="checkbox"
            onChange={this.toggleAll}
            checked={activeTodoCount === 0}
          />
          <ul className="todo-list">
            {todoItems}
          </ul>
        </section>
      );
    }

    return (
      <div>
        <header className="header">
          <h1>todos</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            value={this.state.newTodo}
            onKeyDown={this.handleNewTodoKeyDown}
            onChange={this.handleChange}
            autoFocus={true}
          />
        </header>
        {main}
        {footer}
      </div>
    );
  },
});

const model = new TodoModel();
function render() {
  ReactDOM.render(
    <TodoApp model={model}/>,
    document.getElementsByClassName('todoapp')[0]
  );
}

model.subscribe(render);
window.addEventListener('hashchange', render, false);
render();

import BicycleClient from '../../src/node-store/client';


const client = new BicycleClient();

client.subscribe({
  todos: {
    title: true,
  },
}, res => console.log('query result', res)).loaded.done();
client.subscribe({
  [`todoById(id: "blah") as todo`]: {
    title: true,
    completed: true,
  },
}, res => console.log('single todo', res)).loaded.done();
window.read = function (query, name) {
  return client.subscribe(query, result => console.log(name, result));
};
setTimeout(() => {
  client.update('Todo.markComplete', {id: 'blah'}).done();
}, 1000);
