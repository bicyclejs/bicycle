'use strict';

var _index = require('./index.js');

var users = {
  'ForbesLindesay': { id: 'ForbesLindesay', name: 'Forbes Lindesay', dob: '1992-06-11' },
  'JohnSmith': { id: 'JohnSmith', name: 'John Smith', dob: '1886-06-11' }
};

var schema = (0, _index.prepare)({
  User: (0, _index.type)(function (node) {
    return 'User:' + node.id;
  }, {
    name: 'string',
    dob: 'date'
  }),
  Root: (0, _index.type)(function (node) {
    return 'root';
  }, {
    user: (0, _index.computed)('User', function (node, arg, ctx) {
      return ctx.user;
    }),
    userById: (0, _index.computed)('User', { id: 'string' }, function (node, arg, ctx) {
      return users[arg.id];
    }),
    allUsers: (0, _index.computed)('User[]', function (node, arg, ctx) {
      return Object.keys(users).map(function (id) {
        return users[id];
      });
    })
  })
});

console.dir(schema, { colors: true, depth: 10 });

schema.run({}, { user: users.ForbesLindesay }, [{ name: 'user', arg: {}, fields: [{ name: 'name' }, { name: 'dob' }] }, { name: 'userById', arg: { id: 'ForbesLindesay' }, fields: [{ name: 'name' }] }, { name: 'userById', arg: { id: 'JohnSmith' }, fields: [{ name: 'name' }] }, { name: 'allUsers', arg: {}, fields: [{ name: 'name' }] }]).done(function (result) {
  return console.dir(result, { colors: true, depth: 10 });
});