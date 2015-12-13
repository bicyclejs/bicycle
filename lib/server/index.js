'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./schema');

Object.defineProperty(exports, 'scalar', {
  enumerable: true,
  get: function get() {
    return _schema.scalar;
  }
});
Object.defineProperty(exports, 'type', {
  enumerable: true,
  get: function get() {
    return _schema.type;
  }
});
Object.defineProperty(exports, 'computed', {
  enumerable: true,
  get: function get() {
    return _schema.computed;
  }
});
Object.defineProperty(exports, 'prepare', {
  enumerable: true,
  get: function get() {
    return _schema.prepare;
  }
});
exports.createSessionFactory = createSessionFactory;
function createSessionFactory(schema, store) {
  return function (sessionId, root, ctx) {
    return {
      addQuery: function addQuery(query, params) {
        var prunedResult = {};
        // TODO: params
        return schema.run(root, ctx, query).then(function (result) {
          return Promise.all(Object.keys(result).map(function (id) {
            return store.get(sessionId, 'node:' + id).then(function (clientValue) {
              if (clientValue === undefined) {
                prunedResult[id] = result[id];
                store.set(sessionId, 'node:' + id, result[id]).done(null, function (err) {
                  return console.error('Error saving cache: ' + err.stack);
                });
              } else {
                var serverResult = prune(clientValue, result[id]);
                if (serverResult) {
                  prunedResult[id] = serverResult;
                  store.set(sessionId, 'node:' + id, _extends({}, clientValue, result[id])).done(null, function (err) {
                    return console.error('Error saving cache: ' + err.stack);
                  });
                }
              }
            });
          })).then(function () {
            return prunedResult;
          });
        });
      },
      subscribe: function subscribe(callback) {
        // use tabex to share websockets comms?
      }
    };
  };
}
function prune(clientValue, serverValue) {
  var result = null;
  Object.keys(serverValue).forEach(function (key) {
    if (!equals(clientValue[key], serverValue[key])) {
      if (!result) result = {};
      result[key] = serverValue[key];
    }
  });
  return result;
}
function equals(a, b) {
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.every(function (val, i) {
      return val === b[i];
    });
  }
  return a === b;
}