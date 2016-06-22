import request from 'then-request';

class NetworkLayer {
  constructor(url: ?string, options: ?Object) {
    this._url = url || '/bicycle';
    this._options = options || {};
  }
  send(message: {sessionID: ?string, queryUpdate: ?Object, mutations: Array<{method: string, args: Object}>}) {
    return request('POST', this._url, {...this._options, json: message}).getBody('utf8').then(JSON.parse);
  }
}

export default NetworkLayer;
