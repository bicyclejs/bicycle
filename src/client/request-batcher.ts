import Cache, {CacheUpdate} from '../types/Cache';
import NetworkLayerInterface from '../types/NetworkLayerInterface';
import Query from '../types/Query';
import SessionID from '../types/SessionID';
import diffQueries from '../utils/diff-queries';
import createError from '../utils/create-error';
import Mutation from './mutation';
import {ServerResponseKind} from '../types/ServerResponse';
import SessionVersion from '../types/SessionVersion';
import {
  createNewSessionRequest,
  createUpdateRequest,
  createRestoreRequest,
} from '../types/Request';
import ServerPreparation from '../types/ServerPreparation';
import MutationResult from '../types/MutationResult';

function wait(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

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
  _handleNewSession: (data: Cache) => any;
  _handleUpdate: (data: void | CacheUpdate) => any;
  _handleQueueRequest: () => any;
  _handleSuccessfulResponse: (pendingMutations: number) => any;
}

const enum SessionStatus {
  NEW,
  EXPIRED,
  NORMAL,
}

interface NewSession {
  status: SessionStatus.NEW;
}
interface ExpiredSession {
  status: SessionStatus.EXPIRED;
  sessionID: SessionID;
}
interface NormalSession {
  status: SessionStatus.NORMAL;
  sessionID: SessionID;
  version: SessionVersion;
  serverQuery: Query;
}
type Session = NewSession | ExpiredSession | NormalSession;

class RequestBatcher {
  private _networkLayer: NetworkLayerInterface;
  private _handlers: Handlers;
  private _session: Session;
  private _pendingMutations: Array<Mutation>;
  private _localQuery: Query;
  private _status: RequestStatus;

  constructor(
    networkLayer: NetworkLayerInterface,
    serverPreparation: ServerPreparation | void,
    handlers: Handlers,
  ) {
    this._networkLayer = networkLayer;
    this._handlers = handlers;

    this._session = serverPreparation
      ? {
          status: SessionStatus.NORMAL,
          sessionID: serverPreparation.s,
          version: serverPreparation.v,
          serverQuery: serverPreparation.q,
        }
      : {status: SessionStatus.NEW};
    this._pendingMutations = [];
    this._localQuery = serverPreparation ? serverPreparation.q : {};

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
        this._queueRequest();
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
  private async _queueRequest() {
    this._handlers._handleQueueRequest();
    assert(this._status === RequestStatus.IDLE);
    this._status = RequestStatus.REQUEST_QUEUED;
    // Set up the request but don't fire it for 30ms, this batches up requests
    await wait(30);
    let errors = 0;
    while (this._status === RequestStatus.REQUEST_QUEUED) {
      try {
        this._status = RequestStatus.REQUEST_IN_FLIGHT;
        // gather mutations that are ready to send
        // (i.e. they are not waiting on any optimistic IDs)
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
        const response = await this._fireRequest(localQuery, mutations);
        switch (response.k) {
          // status could be normal or expired before getting this response
          case ServerResponseKind.EXPIRED:
            console.warn('session expired, restoring session');
            this._session = {
              status: SessionStatus.EXPIRED,
              sessionID: (this._session as NormalSession | ExpiredSession)
                .sessionID,
            };
            if (response.m) {
              // we keep resolved mutations because we haven't run a query
              // yet so we still want their optimitic updates
              this._handleMutationResults(mutations, response.m, true);
            }
            this._handlers._handleSuccessfulResponse(
              this._pendingMutations.length,
            );
            // updating clears any rejected mutation's optimstic updates
            this._handlers._handleUpdate(undefined);
            this._status = RequestStatus.REQUEST_QUEUED;
            break;
          // status is always new session before getting this response
          case ServerResponseKind.NEW_SESSION:
            this._session = {
              status: SessionStatus.NORMAL,
              sessionID: response.s,
              version: response.v,
              serverQuery: localQuery,
            };
            this._handlers._handleSuccessfulResponse(
              this._pendingMutations.length,
            );
            this._handlers._handleNewSession(response.d);
            if (this._pendingMutations.length) {
              // send a request with mutations now we have a session
              this._status = RequestStatus.REQUEST_QUEUED;
            }
            break;
          // status is always expired before getting this response
          case ServerResponseKind.RESTORE:
            this._session = {
              status: SessionStatus.NORMAL,
              sessionID: (this._session as ExpiredSession).sessionID,
              version: response.v,
              serverQuery: localQuery,
            };
            if (response.m) {
              this._handleMutationResults(mutations, response.m, false);
            }
            this._handlers._handleSuccessfulResponse(
              this._pendingMutations.length,
            );
            this._handlers._handleNewSession(response.d);
            break;
          // status is always normal before getting this response
          case ServerResponseKind.UPDATE:
            this._session = {
              status: SessionStatus.NORMAL,
              sessionID: (this._session as NormalSession).sessionID,
              version: response.v,
              serverQuery: localQuery,
            };
            if (response.m) {
              this._handleMutationResults(mutations, response.m, false);
            }
            this._handlers._handleSuccessfulResponse(
              this._pendingMutations.length,
            );
            this._handlers._handleUpdate(response.d);
            break;
        }
        errors = 0;
      } catch (ex) {
        errors++;
        this._status === RequestStatus.REQUEST_QUEUED;
        await wait(1000 * (errors + Math.random()));
      }
    }
    assert(this._status === RequestStatus.REQUEST_IN_FLIGHT);
    this._status = RequestStatus.IDLE;
  }

  private async _fireRequest(localQuery: Query, mutations: Mutation[]) {
    switch (this._session.status) {
      case SessionStatus.NEW:
        return this._networkLayer.send(createNewSessionRequest(localQuery));
      case SessionStatus.EXPIRED:
        return this._networkLayer.send(
          createRestoreRequest(this._session.sessionID, localQuery, mutations),
        );
      case SessionStatus.NORMAL:
        return this._networkLayer.send(
          createUpdateRequest(
            this._session.sessionID,
            this._session.version,
            diffQueries(this._session.serverQuery, localQuery),
            mutations,
          ),
        );
    }
  }

  private _handleMutationResults(
    mutations: Mutation[],
    mutationResults: MutationResult<any>[],
    keepResolvedMutations: boolean = false,
  ) {
    mutations.forEach((mutation, i) => {
      if (i >= mutationResults.length) {
        return;
      }
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
    this._pendingMutations = this._pendingMutations.filter(mutation => {
      mutation.updateStatus();
      return (
        mutation.isPending() ||
        (keepResolvedMutations && !mutation.isRejected())
      );
    });
  }
}
export default RequestBatcher;
