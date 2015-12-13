'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = readCache;

var _objectKey = require('../object-key');

var _objectKey2 = _interopRequireDefault(_objectKey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function read(cache, root, id, query, params, extras) {
  var result = { _id: id, _loading: false };
  if (!root) {
    result._loading = true;
    extras.onNotLoaded(id);
    return result;
  }
  query.forEach(function (field) {
    var key = field.arg === undefined || Object.keys(field.arg).length === 0 ? '' : '_' + (0, _objectKey2.default)(field.arg, function (arg) {
      return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg && typeof arg.$param === 'string' ? params[arg.$param] : arg;
    });
    var value = root[field.name + key];
    if (value === undefined) {
      result._loading = true;
      extras.onNotLoaded(id, field.alias || field.name);
      return;
    }
    if (field.fields) {
      result[field.alias || field.name] = Array.isArray(value) ? value.map(function (value) {
        return read(cache, cache[value], value, field.fields, params, extras);
      }) : read(cache, cache[value], value, field.fields, params, extras);
    } else {
      result[field.alias || field.name] = value;
    }
  });
  return result;
}

function readCache(cache, query, params) {
  var loaded = true;
  var nodes = [];
  var result = read(cache, cache.root, 'root', query, params, {
    onNotLoaded: function onNotLoaded() {
      loaded = false;
    },
    onNode: function onNode(id) {
      if (nodes.indexOf(id) === -1) nodes.push(id);
    }
  });
  return { loaded: loaded, result: result, nodes: nodes };
}
/*
let query = [
  {name: 'user', arg: {}, fields: [{name: 'name'}, {name: 'dob'}]},
  {name: 'userById', arg: {id: 'ForbesLindesay'}, fields: [{name: 'name'}], alias: 'ForbesLindesay'},
  {name: 'userById', arg: {id: {$param: 'SecondUser'}}, fields: [{name: 'name'}], alias: 'SecondUser'},
  {name: 'allUsers', arg: {}, fields: [{name: 'name'}]},
];
let cache = { 'User:ForbesLindesay': { name: 'Forbes Lindesay', dob: '1992-06-11' },
  'User:JohnSmith': { name: 'John Smith' },
  root:
   { user: 'User:ForbesLindesay',
     userById_ot4669: 'User:ForbesLindesay',
     userById_ct8c82: 'User:JohnSmith',
     allUsers: [ 'User:ForbesLindesay', 'User:JohnSmith' ] } };
console.dir(readCache(cache, query, {SecondUser: 'JohnSmith'}), {depth: 10, colors: true});
*/