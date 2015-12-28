import {diffCache} from './utils';

export default function (data: Object, sessionID: string, sessionStore: {getCache: Object, setCache: Object}) {
  return sessionStore.getCache(sessionID).then(cache => {
    return sessionStore.setCache(sessionID, data).then(
      () => diffCache(cache, data).result,
    );
  });
}
