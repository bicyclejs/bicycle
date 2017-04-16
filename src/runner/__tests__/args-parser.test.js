// @flow

import parseArgs from '../args-parser';

test('parses args', () => {
  expect(parseArgs('(foo: "bar", bing: 10)')).toEqual({foo: 'bar', bing: 10});
});

test('parses undefined args', () => {
  expect(parseArgs('(foo: "bar", bing: undefined)')).toEqual({foo: 'bar', bing: null});
  expect(parseArgs('(foo: "bar", bing:)')).toEqual({foo: 'bar', bing: null});
});

test('parses empty args', () => {
  expect(parseArgs('()')).toEqual({});
});

test('errors empty arg name', () => {
  expect(
    () => parseArgs('(:"foo")')
  ).toThrowError(
    'Argument name cannot be empty string, full string was "(:"foo")"'
  );
});

test('errors extra text after end of args', () => {
  expect(
    () => parseArgs('(foo: "bar", bing: 10) as foo')
  ).toThrowError(
    'Closing bracket was reached before end of arguments, full string was "(foo: "bar", bing: 10) as foo"'
  );
});

test('errors on missing closing bracket', () => {
  expect(
    () => parseArgs('(foo: "bar", bing: 10')
  ).toThrowError(
    'End of args string reached with no closing bracket, full string was "(foo: "bar", bing: 10"'
  );
});

test('errors on invalid JSON for attribute value', () => {
  expect(
    () => parseArgs('(foo: foo, bing: 10)')
  ).toThrowError(
    'Could not parse arg "foo with value \'foo\', make sure the argument values are always valid JSON strings.'
  );
});
