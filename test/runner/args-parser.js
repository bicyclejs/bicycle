import assert from 'assert';
import test from 'testit';
import parseArgs from 'bicycle/runner/args-parser';

test('args-parser.js', () => {
  assert.deepEqual(parseArgs('(foo: "bar", bing: 10)'), {foo: 'bar', bing: 10});
});
