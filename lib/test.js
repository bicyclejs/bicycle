'use strict';

var _server = require('./server');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _memory = require('./session-stores/memory');

var _memory2 = _interopRequireDefault(_memory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var users = {
  'ForbesLindesay': { id: 'ForbesLindesay', name: 'Forbes Lindesay', dob: '1992-06-11' },
  'JohnSmith': { id: 'JohnSmith', name: 'John Smith', dob: '1886-06-11' }
};

var schema = (0, _server.prepare)({
  User: (0, _server.type)(function (node) {
    return 'User:' + node.id;
  }, {
    name: 'string',
    dob: 'date'
  }, {
    create: function create(obj, ctx) {},
    update: function update(node, obj, ctx) {},
    remove: function remove(node, ctx) {}
  }),
  Root: (0, _server.type)(function (node) {
    return 'root';
  }, {
    user: (0, _server.computed)('User', function (node, arg, ctx) {
      return ctx.user;
    }),
    userById: (0, _server.computed)('User', { id: 'string' }, function (node, arg, ctx) {
      return users[arg.id];
    }),
    allUsers: (0, _server.computed)('User[]', function (node, arg, ctx) {
      return Object.keys(users).map(function (id) {
        return users[id];
      });
    })
  })
});

var createSession = (0, _server.createSessionFactory)(schema, new _memory2.default());
var server = createSession('a', {}, { user: users.ForbesLindesay });

var client = (0, _client2.default)(function (query, params) {
  console.log('server-query');
  console.dir(query, { colors: true, depth: 10 });
  return server.addQuery(query, params).then(function (result) {
    console.log('server-result');
    console.dir(result, { colors: true, depth: 10 });
    return result;
  });
});

client.get([{ name: 'user', arg: {}, fields: [{ name: 'name' }, { name: 'dob' }] }, { name: 'userById', arg: { id: 'ForbesLindesay' }, fields: [{ name: 'name' }], alias: 'ForbesLindesay' },
//{name: 'userById', arg: {id: {$param: 'SecondUser'}}, fields: [{name: 'name'}], alias: 'SecondUser'},
{ name: 'allUsers', arg: {}, fields: [{ name: 'name' }] }]).done(function (result) {
  console.log('result');
  console.dir(result, { depth: 10, colors: true });
  client.get([{ name: 'userById', arg: { id: 'JohnSmith' }, fields: [{ name: 'name' }], alias: 'user' }]).done(function (result) {
    console.log('result');
    console.dir(result, { depth: 10, colors: true });
  });
});