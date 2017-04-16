// @flow

// declare this so that flow-runtime ignores T
type T = mixed;
function id<T>(v: T): T {
  return v;
}
module.exports = process.env.NODE_ENV === 'production' ? id : require('deep-freeze');
