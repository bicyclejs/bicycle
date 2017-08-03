import Cache, {CacheUpdate} from '../types/Cache';
import NetworkLayerInterface from '../types/NetworkLayerInterface';
import Query, {QueryUpdate} from '../types/Query';
import SessionID from '../types/SessionID';
import Promise from 'promise';
import diffQueries from '../utils/diff-queries';
import createError from '../utils/create-error';
import Mutation from './mutation';
import {request as createRequest} from '../messages';
import {ServerResponseKind} from '../types/ServerResponse';

const enum RequestStatus {
  IDLE,
  REQUEST_QUEUED,
  REQUEST_IN_FLIGHT,
}

function assert(fact: boolean): void {
  if (!fact) {
    throw new Error('Assertion violated');
  }
}
function assertUnreachable(p: never): never {
  throw new Error('Expected code to be unreachable');
}

export interface Handlers {
  _handleNetworkError: (err: Error) => any;
  _handleMutationError: (err: Error) => any;
  _handleNewSession: (data: void | Cache) => any;
  _handleUpdate: (data: void | CacheUpdate) => any;
  _handleQueueRequest: () => any;
  _handleSuccessfulResponse: (pendingMutations: number) => any;
}

class RequestBatcher {
  private _networkLayer: NetworkLayerInterface;
  private _handlers: Handlers;
  private _sessionID: SessionID | void;
  private _pendingMutations: Array<Mutation>;
  private _localQuery: Query;
  private _serverQuery: Query | void;
  private _status: RequestStatus;

  constructor(
    networkLayer: NetworkLayerInterface,
    sessionID: SessionID | void,
    query: Query,
    handlers: Handlers,
  ) {
    this._networkLayer = networkLayer;
    this._handlers = handlers;

    this._sessionID = sessionID || undefined;
    this._pendingMutations = [];
    this._localQuery = query;
    this._serverQuery = sessionID ? query : undefined;

    this._status = RequestStatus.IDLE;
  }

  updateQuery(query: Query) {
    this._localQuery = query;
    this._request();
  }

  runMutation(mutation: Mutation): Promise<any> {
    this._pendingMutations.push(mutation);
    this._request();
    this._handlers._handleUpdate(undefined);
    return mutation.getResult();
  }
  getPendingMutations(): Array<Mutation> {
    return this._pendingMutations;
  }

  // make request, using any in-flight requests
  private _request() {
    switch (this._status) {
      case RequestStatus.IDLE:
        this._queueRequest(30);
        break;
      case RequestStatus.REQUEST_QUEUED:
        break;
      case RequestStatus.REQUEST_IN_FLIGHT:
        this._status = RequestStatus.REQUEST_QUEUED;
        break;
      default:
        assertUnreachable(this._status);
    }
  }

  // queue a new request
  private _queueRequest(timeout: number, errCount: number = 0) {
    this._handlers._handleQueueRequest();
    assert(this._status === RequestStatus.IDLE);
    this._status = RequestStatus.REQUEST_QUEUED;
    // Set up the request but don't fire it for 30ms, this batches up requests
    setTimeout(
      () =>
        this._fireRequest().done(
          () => {
            switch (this._status) {
              case RequestStatus.IDLE:
                throw new Error(
                  'status should never be idle when a request is in flight',
                );
              case RequestStatus.REQUEST_QUEUED:
                this._status = RequestStatus.IDLE;
                this._queueRequest(0);
                break;
              case RequestStatus.REQUEST_IN_FLIGHT:
                this._status = RequestStatus.IDLE;
                if (this._pendingMutations.length) {
                  this._queueRequest(0);
                }
                break;
            }
          },
          err => {
            this._status = RequestStatus.IDLE;
            this._queueRequest(
              timeout + 1000 * (errCount + Math.random()),
              errCount + 1,
            );
            this._handlers._handleNetworkError(err);
          },
        ),
      timeout,
    );
  }

  private _fireRequest() {
    assert(this._status === RequestStatus.REQUEST_QUEUED);
    this._status = RequestStatus.REQUEST_IN_FLIGHT;
    return new Promise((resolve, reject) => {
      const attempt = () => {
        const localQuery = this._localQuery;
        const mutations: Mutation[] = [];
        for (
          let i = 0;
          i < this._pendingMutations.length &&
          !this._pendingMutations[i].isBlocked();
          i++
        ) {
          if (this._pendingMutations[i].isPending()) {
            mutations.push(this._pendingMutations[i]);
          }
        }
        const message = createRequest(
          this._sessionID,
          this._serverQuery
            ? diffQueries(this._serverQuery, localQuery)
            : localQuery as QueryUpdate,
          mutations.map(m => m.mutation),
        );
        return Promise.resolve(
          this._networkLayer.send(message),
        ).done(response => {
          const mutationResults = response.m;
          if (mutationResults) {
            mutations.forEach((mutation, i) => {
              const result = mutationResults[i];
              if (result.s) {
                mutation.resolve(result.v);
              } else {
                const err = createError(result.v.message, {
                  data: result.v.data,
                  code: result.v.code,
                  mutation: mutation.mutation,
                });
                this._handlers._handleMutationError(err);
                mutation.reject(err);
              }
            });
          }
          switch (response.k) {
            case ServerResponseKind.EXPIRED:
              console.warn('session expired, starting new session');
              this._sessionID = undefined;
              this._serverQuery = undefined;
              this._status = RequestStatus.REQUEST_IN_FLIGHT;
              // if we haven't managed to run the query, we cannot remove mutations that have been successfully applied
              // on the server side because their optimistic effects may still apply.
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return !mutation.isRejected();
                },
              );
              this._handlers._handleUpdate(undefined);
              attempt();
              break;
            case ServerResponseKind.NEW_SESSION:
              this._sessionID = response.s;
              this._serverQuery = localQuery;
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return mutation.isPending();
                },
              );
              this._handlers._handleSuccessfulResponse(
                this._pendingMutations.length,
              );
              this._handlers._handleNewSession(response.d);
              resolve();
              break;
            case ServerResponseKind.UPDATE:
              this._serverQuery = localQuery;
              this._pendingMutations = this._pendingMutations.filter(
                mutation => {
                  mutation.updateStatus();
                  return mutation.isPending();
                },
              );
              this._handlers._handleSuccessfulResponse(
                this._pendingMutations.length,
              );
              this._handlers._handleUpdate(response.d);
              resolve();
              break;
          }
        }, reject);
      };
      attempt();
    });
  }
}
export default RequestBatcher;
