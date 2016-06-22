import Promise from 'promise';
import diffQueries from 'bicycle/utils/diff-queries';
import Mutation from './mutation';

const PENDING_OPTIMISTIC_ID = {};
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
      _handleUpdate: (data: ?Object, isNew: boolean) => mixed,
    },
  ) {
    this._networkLayer = networkLayer;
    this._handlers = handlers;

    this._sessionID = sessionID;
    this._pendingMutations = [];
    this._localQuery = query;
    this._serverQuery = sessionID ? query : {};

    this._status = IDLE;
  }

  updateQuery(query: Object) {
    this._localQuery = query;
    this._request();
  }

  runMutation(mutation: Mutation): Promise<any> {
    this._pendingMutations.push(mutation);
    this._request();
    this._handlers._handleUpdate(null, false);
    return mutation.getResult();
  }
  getPendingMutations(): Array<{applyOptimistic: (cache: Object) => Object}> {
    return this._pendingMutations;
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
              if (this._pendingMutations.length) {
                this._queueRequest(0);
              }
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
        const mutations = [];
        for (
          let i = 0;
          i < this._pendingMutations.length && !this._pendingMutations[i].isBlocked();
          i++
        ) {
          if (this._pendingMutations[i].isPending()) {
            mutations.push(this._pendingMutations[i]);
          }
        }
        const message = {
          sessionID: this._sessionID,
          queryUpdate: diffQueries(this._serverQuery, localQuery),
          mutations: mutations.map(m => m.mutation),
        };
        return this._networkLayer.send(message).done(
          response => {
            mutations.forEach((mutation, i) => {
              if (response.mutationResults[i].success) {
                mutation.resolve(response.mutationResults[i].value);
              } else {
                mutation.reject(new Error(response.mutationResults[i].value));
              }
            });
            if (response.expiredSession) {
              console.warn('session expired, starting new session');
              this._sessionID = null;
              this._serverQuery = {};
              this._status = REQUEST_IN_FLIGHT;
              // if we haven't managed to run the query, we cannot remove mutations that have been successfully applied
              // on the server side because their optimistic effects may still apply.
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return !mutation.isRejected();
                }
              );
              this._handlers._handleUpdate(null, false);
              attempt();
            } else {
              const isNew = !this._sessionID;
              this._sessionID = response.sessionID;
              this._serverQuery = localQuery;
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return mutation.isPending();
                }
              );
              this._handlers._handleUpdate(response.data, isNew);
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
