import request from 'then-request';

export default function NetworkLayer(url: ?string, options: ?Object) {
  this._url = url || '/bicycle';
  this._options = options || {};
}
NetworkLayer.prototype.batch = function (sessionID: string, requests: Array<Object>) {
  return request('POST', this._url, {...this._options, json: {sessionID, requests}}).getBody('utf8').then(JSON.parse);
};
