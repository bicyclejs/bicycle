'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = reduceState;
// actions:
//  server response
//  begin query
//  begin update

function reduceCache(cache, response) {
  var result = _extends({}, cache);
  Object.keys(response).forEach(function (key) {
    result[key] = cache[key] ? _extends({}, cache[key], response[key]) : response[key];
  });
  return result;
}

function reduceState(state, action) {
  switch (action.type) {
    case 'BICYCLE_SERVER_RESPONSE':
      return _extends({}, state, { cache: reduceCache(state.cache, action.payload) });
    default:
      return state;
  }
}