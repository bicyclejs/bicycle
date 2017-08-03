import ClientRequest from './ClientRequest';
import ServerResponse from './ServerResponse';

export default interface NetworkLayerInterface {
  send: (message: ClientRequest) => PromiseLike<ServerResponse>;
};
