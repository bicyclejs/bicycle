import Promise from 'promise';
import diffQueries from 'bicycle/utils/diff-queries';
import Mutation from './mutation';
import {request as createRequest} from '../messages';

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
    query: Object,
    handlers: {
      _handleNetworkError: (err: Error) => mixed,
      _handleMutationError: (err: Error) => mixed,
      _handleUpdate: (data: ?Object, isNew: boolean) => mixed,
      _handleQueueRequest: () => mixed,
      _handleSuccessfulResponse: (pendingMutations: number) => mixed,
    },
  ) {
    this._networkLayer = networkLayer;
    this._handlers = handlers;

    this._sessionID = sessionID || undefined;
    this._pendingMutations = [];
    this._localQuery = query;
    this._serverQuery = sessionID ? query : undefined;

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
    this._handlers._handleQueueRequest();
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
          this._handlers._handleNetworkError(err);
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
        const message = createRequest(
          this._sessionID,
          this._serverQuery ? diffQueries(this._serverQuery, localQuery) : localQuery,
          mutations.map(m => m.mutation),
        );
        return this._networkLayer.send(message).done(
          response => {
            const sessionID = response.s;
            const cacheUpdate = response.d;
            const mutationResults = response.m;
            mutations.forEach((mutation, i) => {
              if (mutationResults[i] === true) {
                mutation.resolve();
              } else if (mutationResults[i].s) {
                mutation.resolve(mutationResults[i].v);
              } else {
                const err = new Error(mutationResults[i].v.message);
                err.data = mutationResults[i].v.data;
                err.code = mutationResults[i].v.code;
                err.mutation = mutation.mutation;
                this._handlers._handleMutationError(err);
                mutation.reject(err);
              }
            });
            if (!sessionID) {
              console.warn('session expired, starting new session');
              this._sessionID = undefined;
              this._serverQuery = undefined;
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
              this._sessionID = sessionID;
              this._serverQuery = localQuery;
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return mutation.isPending();
                }
              );
              this._handlers._handleSuccessfulResponse(this._pendingMutations.length);
              this._handlers._handleUpdate(cacheUpdate, isNew);
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
