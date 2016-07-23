import test from 'testit';

test('load-schema', () => {
  require('./load-schema');
});
test('runner', () => {
  require('./runner');
});
test('utils', () => {
  require('./utils');
});

// N.B. run integration tests only after unit tests have passed
test('integration tests', () => {
  require('./integration');
});
