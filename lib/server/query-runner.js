'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runQuery;

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _objectKey = require('../object-key');

var _objectKey2 = _interopRequireDefault(_objectKey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

// query is array of fields
// each field is {name, arg, fields}

// root is {type: 'node', getId: getId, fields: fields}
function run(root, ctx, rootSchema, schema, query, result) {
  var id = undefined;
  return _promise2.default.resolve(null).then(function () {
    return _promise2.default.all([rootSchema.getId(root, ctx)].concat(query.map(function (field) {
      var _rootSchema$fields$fi = rootSchema.fields[field.name];
      var type = _rootSchema$fields$fi.type;
      var argType = _rootSchema$fields$fi.argType;
      var fn = _rootSchema$fields$fi.fn;

      return _promise2.default.resolve(null).then(function () {
        return validateType(field.arg, argType || {}, schema);
      }).then(function (arg) {
        return fn(root, arg, ctx);
      }).then(function (value) {
        var optional = type[0] === '?';
        var isArray = /\[\]$/.test(type);
        if (optional) type = type.substr(1);
        if (isArray) type = type.replace(/\[\]$/, '');
        if (/^[a-z]/.test(type)) {
          // validate scalar
          return validateType(value, type, { optional: optional, isArray: isArray }, schema);
        } else {
          if (optional && value === null) return null;
          if (isArray) {
            if (!Array.isArray(value)) throw new Error('Expected an array');
            return _promise2.default.all(value.map(function (value) {
              return run(value, ctx, schema[type], schema, field.fields, result);
            }));
          }
          // query child node and return "node id"
          return run(value, ctx, schema[type], schema, field.fields, result);
        }
      }).then(function (finalValue) {
        var key = field.arg === undefined || Object.keys(field.arg).length === 0 ? '' : '_' + (0, _objectKey2.default)(field.arg);
        return { name: field.name + key, value: finalValue };
      });
    })));
  }).then(function (_ref) {
    var _ref2 = _toArray(_ref);

    var id = _ref2[0];

    var fields = _ref2.slice(1);

    var fieldsObj = result[id] || (result[id] = {});
    fields.forEach(function (field) {
      fieldsObj[field.name] = field.value;
    });
    return id;
  });
}

function validateType(value, type, _ref3, schema) {
  var optional = _ref3.optional;
  var isArray = _ref3.isArray;

  // TODO: validate type
  return value;
}

function runQuery(schema, root, context, query) {
  var result = {};
  return run(root, context, schema.Root, schema, query, result).then(function (id) {
    if (id !== 'root') {
      console.dir(id);
      console.dir(id !== 'root');
      throw new Error('The root node must have an id of "root" but got "' + id + '"');
    }
    return result;
  });
}