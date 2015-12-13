import {scalar, type, computed, prepare} from './index.js';

var users = {
  'ForbesLindesay': {id: 'ForbesLindesay', name: 'Forbes Lindesay', dob: '1992-06-11'},
  'JohnSmith': {id: 'JohnSmith', name: 'John Smith', dob: '1886-06-11'}
};

var schema = prepare({
  User: type(
    node => 'User:' + node.id,
    {
      name: 'string',
      dob: 'date'
    }
  ),
  Root: type(
    node => 'root',
    {
      user: computed('User', (node, arg, ctx) => ctx.user),
      userById: computed('User', {id: 'string'}, (node, arg, ctx) => users[arg.id]),
      allUsers: computed('User[]', (node, arg, ctx) => Object.keys(users).map(id => users[id])),
    }
  )
});

console.dir(schema, {colors: true, depth: 10});

schema.run(
  {},
  {user: users.ForbesLindesay},
  [
    {name: 'user', arg: {}, fields: [{name: 'name'}, {name: 'dob'}]},
    {name: 'userById', arg: {id: 'ForbesLindesay'}, fields: [{name: 'name'}]},
    {name: 'userById', arg: {id: 'JohnSmith'}, fields: [{name: 'name'}]},
    {name: 'allUsers', arg: {}, fields: [{name: 'name'}]}
  ]
).done(result => console.dir(result, {colors: true, depth: 10}));
