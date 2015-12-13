'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryStore = (function () {
  function MemoryStore() {
    _classCallCheck(this, MemoryStore);

    this._store = {};
  }

  _createClass(MemoryStore, [{
    key: 'set',
    value: function set(session, key, value) {
      if (!this._store[session]) this._store[session] = {};
      this._store[session]['!' + key] = value;
      return _promise2.default.resolve(null);
    }
  }, {
    key: 'get',
    value: function get(session, key) {
      if (!this._store[session]) this._store[session] = {};
      return _promise2.default.resolve(this._store[session]['!' + key]);
    }
  }]);

  return MemoryStore;
})();

exports.default = MemoryStore;