import request, {Options} from 'then-request';
import ClientRequest from './types/ClientRequest';
import ServerResponse from './types/ServerResponse';

export {Options};

class NetworkLayer {
  private readonly _url: string;
  private readonly _options: Options;
  constructor(url?: string, options?: Options) {
    this._url = url || '/bicycle';
    this._options = options || {};
  }
  send(message: ClientRequest): Promise<ServerResponse> {
    return request('POST', this._url, {...this._options, json: message})
      .getBody('utf8')
      .then(JSON.parse);
  }
}

export default NetworkLayer;
