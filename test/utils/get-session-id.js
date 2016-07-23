import assert from 'assert';
import Promise from 'promise';
import test from 'testit';
import getSessionID from 'bicycle/utils/get-session-id';

test('get-session-id.js', () => {
  test('generates a string of 16 random characters', () => {
    const results = [];
    // run this many many times to compensate for the randomness in generating a random ID.
    // and to verify that a unique ID is generted across a reasonably large set of IDs.
    for (let i = 0; i < 10000; i++) {
      results.push(
        getSessionID().then(id => {
          assert.strictEqual(typeof id, 'string');
          assert.strictEqual(id.length, 16);
          // Note that we verify that there are no `=` signs used for padding.
          assert(/^[A-Za-z0-9\+\/]{16}$/.test(id), 'Expected id ' + id + ' to match pattern');
          return id;
        }),
      );
    }
    return Promise.all(results).then(ids => {
      ids.forEach((id, index) => {
        assert(ids.indexOf(id) === index, 'expected ids to be unique');
      });
    });
  });
});
