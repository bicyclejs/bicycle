// Copyright (c) 2014 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html

function crc32_bitwise (text) {
  var crc = 0xFFFFFFFF;
  for (var i = 0, l = text.length; i < l; i++) {
    crc ^= text.charCodeAt(i);
    for (var bit = 0; bit < 8; bit++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  return ~crc;
}

module.exports = crc32_bitwise;
