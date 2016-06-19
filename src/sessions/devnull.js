// @public

import Promise from 'promise';
import freeze from 'bicycle/utils/freeze';

const NULL_PROMISE = Promise.resolve(null);
const EMPTY_OBJECT_PROMISE = Promise.resolve(freeze({}));

class DevNullSession {
  getCache(sessionId: string): Promise<Object> {
    return EMPTY_OBJECT_PROMISE;
  }
  setCache(sessionId: string, data: Object): Promise {
    return NULL_PROMISE;
  }
  getQuery(sessionId: string): Promise<?Object> {
    return NULL_PROMISE;
  }
  setQuery(sessionId: string, query: Object): Promise {
    return NULL_PROMISE;
  }
}

export default DevNullSession;
