import SessionID from '../types/SessionID';
import SessionStore from '../sessions/SessionStore';
import {randomBytes} from 'crypto';

function randomBytesAsync(n: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    randomBytes(n, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });
}

export default function getSessionID(
  sessionStore: SessionStore,
): Promise<SessionID> {
  return sessionStore && sessionStore.getSessionID
    ? Promise.resolve(null).then(() => sessionStore.getSessionID!())
    : randomBytesAsync(12).then(sessionID =>
        SessionID.unsafeCast(sessionID.toString('base64')),
      );
}
