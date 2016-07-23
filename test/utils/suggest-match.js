import assert from 'assert';
import test from 'testit';
import freeze from 'bicycle/utils/freeze';
import suggestMatch from 'bicycle/utils/suggest-match';


test('suggest-match.js', () => {
  test('returns empty string when there is no close match', () => {
    assert.strictEqual(suggestMatch(freeze(['foo', 'bar']), 'whatever'), '');
  });
  test('returns a string recommending the closest match when one is available', () => {
    assert.strictEqual(suggestMatch(freeze(['foo', 'bar']), 'barr'), ' maybe you meant to use "bar"');
  });
});
