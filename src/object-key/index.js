var crc = require('./crc');
var str = require('./str');

module.exports = function (obj, replacer) {
  return crc(str(obj, replacer)).toString(36);
};
