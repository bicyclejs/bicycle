import Request from './Request';
import ServerResponse from './ServerResponse';

export default interface NetworkLayerInterface {
  send: (message: Request) => PromiseLike<ServerResponse>;
}
