// @flow

import freeze from '../freeze';
import suggestMatch from '../suggest-match';

test('returns empty string when there is no close match', () => {
  expect(suggestMatch(freeze(['foo', 'bar']), 'whatever')).toBe('');
});
test('returns a string recommending the closest match when one is available', () => {
  expect(suggestMatch(freeze(['foo', 'bar']), 'barr')).toBe(' maybe you meant to use "bar"');
});
