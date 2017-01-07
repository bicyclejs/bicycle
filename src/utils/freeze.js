// @flow

function id<T>(v: T): T {
  return v;
}
module.exports = process.env.NODE_ENV === 'production' ? id : require('deep-freeze');
