// Copyright (c) 2014 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html

export default function crc32(text) {
  let crc = 0xFFFFFFFF;
  for (let i = 0, l = text.length; i < l; i++) {
    crc ^= text.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  return (~crc).toString(16).replace(/[^a-zA-Z0-9]/, '');
}
