import {randomBytes} from 'crypto';
import Promise from 'promise';

const randomBytesAsync = Promise.denodeify(randomBytes);

export default function getSessionID(sessionStore) {
  return (
    sessionStore && sessionStore.getSessionID
    ? Promise.resolve(null).then(() => sessionStore.getSessionID())
    : randomBytesAsync(12).then(sessionID => sessionID.toString('base64'))
  );
}
