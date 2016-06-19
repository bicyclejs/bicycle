import {randomBytes} from 'crypto';
import Promise from 'promise';

const randomBytesAsync = Promise.denodeify(randomBytes);

export default function getSessionID(sessionStore) {
  return (
    sessionStore.getSessionID
    ? Promise.resolve(null).then(() => sessionStore.getSessionID())
    : randomBytesAsync(10).then(sessionID => sessionID.toString('hex'))
  );
}
