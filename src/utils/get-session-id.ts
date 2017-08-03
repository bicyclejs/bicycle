// @flow

import SessionID from '../types/SessionID';
import SessionStore from '../sessions/SessionStore';
import {randomBytes} from 'crypto';
import Promise from 'promise';

const randomBytesAsync = Promise.denodeify(randomBytes);

export default function getSessionID(
  sessionStore: SessionStore,
): Promise<SessionID> {
  return sessionStore && sessionStore.getSessionID
    ? Promise.resolve(null).then(() => sessionStore.getSessionID!())
    : randomBytesAsync(12).then(sessionID => sessionID.toString('base64'));
}
