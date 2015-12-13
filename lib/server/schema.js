'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scalar = scalar;
exports.type = type;
exports.computed = computed;
exports.prepare = prepare;

var _queryRunner = require('./query-runner');

var _queryRunner2 = _interopRequireDefault(_queryRunner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var builtins = {};
['boolean', 'number', 'string'].forEach(function (type) {
  builtins[type] = {
    type: 'scalar',
    validate: function validate(value, context) {
      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== type) {
        throw new TypeError('Expected a "' + type + '" but got "' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)) + '" for ' + context);
      }
    }
  };
});

var DAYS_IN_MONTH = [31, 29, // 29 in leap years, otherwise 28
31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
builtins.date = {
  type: 'scalar',
  validate: function validate(value, context) {
    if (typeof value !== 'string') {
      throw new TypeError('Expected a "Date" as a string in the form "yyyy-mm-dd" but got "' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)) + '" for ' + context);
    }
    if (!/^\d\d\d\d\-\d\d\-\d\d$/.test(value)) {
      throw new TypeError('Expected a "yyyy-mm-dd" but got "' + value + '" for ' + context);
    }
    var month = +value.split('-')[1] - 1;
    var day = +value.split('-')[2];
    if (month < 0 || month > DAYS_IN_MONTH.length || day < 1 || day > DAYS_IN_MONTH[month]) {
      throw new TypeError('Invalid date "' + value + '" for ' + context);
    }
  }
};

function scalar(validate, parent) {
  return {
    type: 'scalar',
    validate: validate,
    parent: parent
  };
}

function type(getId, fields) {
  var f = {};
  Object.keys(fields).forEach(function (key) {
    if (_typeof(fields[key]) === 'object') {
      f[key] = fields[key];
    } else {
      f[key] = {
        type: fields[key],
        fn: function fn(self) {
          return self[key];
        }
      };
    }
  });
  return {
    type: 'node',
    getId: getId,
    fields: f
  };
}

function computed(type, argType, fn) {
  if (typeof argType === 'function') {
    fn = argType;
    argType = undefined;
  }
  return {
    type: type,
    argType: argType,
    fn: fn
  };
}

function prepare(schema) {
  Object.keys(schema).forEach(function (key) {});
  schema.run = function (root, context, query) {
    return (0, _queryRunner2.default)(schema, root, context, query);
  };
  return schema;
}