'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (runQuery) {
  var state = { cache: {} };
  function dispatch(action) {
    state = (0, _cache2.default)(state, action);
  }
  return {
    get: function get(query, params) {
      var _reader = (0, _reader4.default)(state.cache, query, params);

      var result = _reader.result;
      var loaded = _reader.loaded;

      if (loaded) return _promise2.default.resolve(result);
      return runQuery(query, params).then(function (payload) {
        dispatch({ type: 'BICYCLE_SERVER_RESPONSE', payload: payload, nodes: Object.keys(payload) });
        return (0, _reader4.default)(state.cache, query, params).result;
      });
    },
    getSync: function getSync(query, params) {
      var _reader2 = (0, _reader4.default)(state.cache, query, params);

      var result = _reader2.result;
      var loaded = _reader2.loaded;

      if (!loaded) {
        runQuery(query, params).done(function (payload) {
          dispatch({ type: 'BICYCLE_SERVER_RESPONSE', payload: payload, nodes: Object.keys(payload) });
        });
      }
      return result;
    }
  };
};

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

var _reader3 = require('./reader');

var _reader4 = _interopRequireDefault(_reader3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;