import Promise from 'promise';
import getSessionID from 'bicycle/utils/get-session-id';

test('generates a string of 16 random characters', () => {
  const results = [];
  // run this many many times to compensate for the randomness in generating a random ID.
  // and to verify that a unique ID is generted across a reasonably large set of IDs.
  for (let i = 0; i < 10000; i++) {
    results.push(
      getSessionID().then(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBe(16);
        // Note that we verify that there are no `=` signs used for padding.
        expect(id).toMatch(/^[A-Za-z0-9\+\/]{16}$/);
        return id;
      }),
    );
  }
  return Promise.all(results).then(ids => {
    ids.forEach((id, index) => {
      expect(ids.indexOf(id)).toBe(index); // expect ids to be unique
    });
  });
});

test('defers to store if provided', () => {
  return getSessionID({getSessionID() { return '1'; }}).then(id => {
    expect(id).toBe('1');
  });
});
