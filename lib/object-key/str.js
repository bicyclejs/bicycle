'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

// source: https://github.com/substack/json-stable-stringify
// modified to remove options

module.exports = function (obj, replacer) {
  var seen = [];
  return (function stringify(node) {
    if (replacer) node = replacer(node);
    if (node === undefined) {
      return;
    }
    if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) !== 'object' || node === null) {
      return JSON.stringify(node);
    }
    if (Array.isArray(node)) {
      if (seen.indexOf(node) !== -1) {
        throw new TypeError('Converting circular structure to JSON');
      } else seen.push(node);
      var out = [];
      for (var i = 0; i < node.length; i++) {
        var item = stringify(node[i]) || 'undefined';
        out.push(item);
      }
      return '[' + out.join(',') + ']';
    } else {
      if (seen.indexOf(node) !== -1) {
        throw new TypeError('Converting circular structure to JSON');
      } else seen.push(node);

      var keys = Object.keys(node).sort();
      var out = [];
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = stringify(node[key]);

        if (!value) continue;

        var keyValue = key + ':' + value;
        out.push(keyValue);
      }
      return '{' + out.join(',') + '}';
    }
  })(obj);
};