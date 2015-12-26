import {diffCache} from './utils';

export default function (data, sessionID, sessionStore) {
  return sessionStore.getCache(sessionID).then(cache => {
    return sessionStore.setCache(sessionID, data).then(
      () => diffCache(cache, data).result,
    );
  });
}
