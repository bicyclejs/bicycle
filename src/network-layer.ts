import request, {Options} from 'then-request';
import Request from './types/Request';
import NetworkLayerInterface from './types/NetworkLayerInterface';
import ServerResponse from './types/ServerResponse';

export {Options};

class NetworkLayer implements NetworkLayerInterface {
  private readonly _url: string;
  private readonly _options: Options;
  constructor(url?: string, options?: Options) {
    this._url = url || '/bicycle';
    this._options = options || {};
  }
  send(message: Request): Promise<ServerResponse> {
    return request('POST', this._url, {...this._options, json: message})
      .getBody('utf8')
      .then(JSON.parse);
  }
}

export default NetworkLayer;
