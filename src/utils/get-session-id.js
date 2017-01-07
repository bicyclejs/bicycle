// @flow

import type {SessionStore} from '../flow-types';
import {randomBytes} from 'crypto';
import Promise from 'promise';

const randomBytesAsync = Promise.denodeify(randomBytes);

export default function getSessionID(sessionStore: SessionStore): Promise<string> {
  return (
    sessionStore && sessionStore.getSessionID
    // $FlowFixMe: flow can't handle the type narrowing
    ? Promise.resolve(null).then(() => sessionStore.getSessionID())
    : randomBytesAsync(12).then(sessionID => sessionID.toString('base64'))
  );
}
