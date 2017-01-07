// @flow

import type {ClientRequest, Query, ServerResponse, SessionID} from './flow-types';
import request from 'then-request';

class NetworkLayer {
  _url: string;
  _options: Object;
  constructor(url: ?string, options: ?Object) {
    this._url = url || '/bicycle';
    this._options = options || {};
  }
  send(message: ClientRequest): Promise<ServerResponse> {
    return request('POST', this._url, {...this._options, json: message}).getBody('utf8').then(JSON.parse);
  }
}

export default NetworkLayer;
