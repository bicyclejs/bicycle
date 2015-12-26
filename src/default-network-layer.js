import request from 'then-request';

export default function NetworkLayer(url, options) {
  this._url = url || '/bicycle';
  this._options = options || {};
}
NetworkLayer.prototype.batch = function (sessionID, requests) {
  return request('POST', this._url, {...this._options, json: {sessionID, requests}}).getBody('utf8').then(JSON.parse);
};
