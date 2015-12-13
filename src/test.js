import {scalar, type, computed, prepare, createSessionFactory} from './server';
import createClient from './client';
import MemoryStore from './session-stores/memory';

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
    },
    {
      create(obj, ctx) {
      },
      update(node, obj, ctx) {
      },
      remove(node, ctx) {
      }
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

let createSession = createSessionFactory(schema, new MemoryStore());
let server = createSession('a', {}, {user: users.ForbesLindesay});

let client = createClient(
  (query, params) => {
    console.log('server-query');
    console.dir(query, {colors: true, depth: 10});
    return server.addQuery(query, params).then(
      result => {
        console.log('server-result');
        console.dir(result, {colors: true, depth: 10});
        return result;
      }
    );
  }
);


client.get([
  {name: 'user', arg: {}, fields: [{name: 'name'}, {name: 'dob'}]},
  {name: 'userById', arg: {id: 'ForbesLindesay'}, fields: [{name: 'name'}], alias: 'ForbesLindesay'},
  //{name: 'userById', arg: {id: {$param: 'SecondUser'}}, fields: [{name: 'name'}], alias: 'SecondUser'},
  {name: 'allUsers', arg: {}, fields: [{name: 'name'}]},
]).done(
  result => {
    console.log('result');
    console.dir(result, {depth: 10, colors: true});
    client.get([
      {name: 'userById', arg: {id: 'JohnSmith'}, fields: [{name: 'name'}], alias: 'user'}
    ]).done(
      result => {
        console.log('result');
        console.dir(result, {depth: 10, colors: true});
      }
    );
  }
);

