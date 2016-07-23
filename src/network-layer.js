import request from 'then-request';

class NetworkLayer {
  constructor(url: ?string, options: ?Object) {
    this._url = url || '/bicycle';
    this._options = options || {};
  }
  send(message: {s: ?string, q: ?Object, m: Array<{m: string, a: Object}>}) {
    return request('POST', this._url, {...this._options, json: message}).getBody('utf8').then(JSON.parse);
  }
}

export default NetworkLayer;
