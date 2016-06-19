import Promise from 'promise';
import diffQueries from 'bicycle/utils/diff-queries';

const IDLE = 'IDLE';
const REQUEST_QUEUED = 'REQUEST_QUEUED';
const REQUEST_IN_FLIGHT = 'REQUEST_IN_FLIGHT';

function assert(fact) {
  if (!fact) {
    throw new Error('Assertion violated');
  }
}

class RequestBatcher {
  constructor(
    networkLayer: {send: Function},
    sessionID: ?string,
    query: {},
    handlers: {
      _handleError: (err: Error) => mixed,
      _handleUpdate: (data: Object, isNew: boolean, mutationsProcessed: number) => mixed
    },
  ) {
    this._networkLayer = networkLayer;
    this._handlers = handlers;

    this._sessionID = sessionID;
    this._pendingMutations = [];
    this._localQuery = query;
    this._serverQuery = sessionID ? query : {};
    // track mutations that have been processed (and should thus have their optimistic updates discarded once we get an update form the server)
    this._mutationsProcessed = 0;

    this._status = IDLE;
  }

  updateQuery(query: Object) {
    this._localQuery = query;
    this._request();
  }

  runMutation(mutation: Object): Promise<void> {
    return new Promise((resolve, reject) => {
      this._pendingMutations.push({
        mutation,
        resolve,
        reject,
      });
      this._request();
    });
  }

  // make request, using any in-flight requests
  _request() {
    switch (this._status) {
      case IDLE:
        this._queueRequest(30);
        break;
      case REQUEST_QUEUED:
        break;
      case REQUEST_IN_FLIGHT:
        this._status = REQUEST_QUEUED;
        break;
    }
  }

  // queue a new request
  _queueRequest(timeout, errCount = 0) {
    assert(this._status === IDLE);
    this._status = REQUEST_QUEUED;
    // Set up the request but don't fire it execute it for 30ms
    setTimeout(
      () => this._fireRequest().done(
        () => {
          switch (this._status) {
            case IDLE:
              throw new Error('status should never be idle when a request is in flight');
            case REQUEST_QUEUED:
              this._status = IDLE;
              this._queueRequest(0);
              break;
            case REQUEST_IN_FLIGHT:
              this._status = IDLE;
              break;
          }
        },
        err => {
          this._status = IDLE;
          this._queueRequest(timeout + (1000 * (errCount + Math.random())), errCount + 1);
          this._handlers._handleError(err);
        }
      ),
      timeout,
    );
  }

  _fireRequest() {
    assert(this._status === REQUEST_QUEUED);
    this._status = REQUEST_IN_FLIGHT;
    return new Promise((resolve, reject) => {
      const attempt = () => {
        const localQuery = this._localQuery;
        const message = {
          sessionID: this._sessionID,
          queryUpdate: diffQueries(this._serverQuery, localQuery),
          mutations: this._pendingMutations.map(m => m.mutation),
        };
        this._networkLayer.send(message).done(
          response => {
            const mutations = this._pendingMutations.splice(0, response.mutationResults.length);
            this._mutationsProcessed += response.mutationResults.length;
            mutations.forEach((mutation, i) => {
              if (response.mutationResults[i].success) {
                mutation.resolve(response.mutationResults[i].value);
              } else {
                // ideally we would prepaturely roll back this optimistic mutation
                mutation.reject(response.mutationResults[i].value);
              }
            });
            if (response.expiredSession) {
              console.warn('session expired, starting new session');
              this._sessionID = null;
              this._serverQuery = {};
              this._status = REQUEST_IN_FLIGHT;
              attempt();
            } else {
              const IS_NEW = !this._sessionID;
              this._sessionID = response.sessionID;
              this._serverQuery = localQuery;
              const mutationsProcessed = this._mutationsProcessed;
              this._mutationsProcessed = 0;
              this._handlers._handleUpdate(response.data, IS_NEW, mutationsProcessed);
              resolve();
            }
          },
          reject,
        );
      };
      attempt();
    });
  }

}
export default RequestBatcher;
