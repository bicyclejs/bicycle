import cuid = require('cuid');
import withContext, {Ctx} from './Ctx';
import MutationResult from './types/MutationResult';
import ServerResponse, {
  createExpiredSessionResponse,
  createNewSessionResponse,
  createRestoreResponse,
  createUpdateResponse,
} from './types/ServerResponse';
import SessionVersion from './types/SessionVersion';
import SessionStore from './sessions/SessionStore';
import Request, {RequestKind} from './types/Request';
import mergeQueries from './utils/merge-queries';
import diffCache from './utils/diff-cache';
import getSessionID from './utils/get-session-id';
import {runQuery, runMutation} from './runner';
import Logging from './types/Logging';
import Schema from './types/Schema';

export default async function handleMessage<Context>(
  schema: Schema<Context>,
  logging: Logging,
  sessionStore: SessionStore,
  message: Request,
  context: () => Ctx<Context>,
  mutationContext?: () => Ctx<Context>,
) {
  // New sessions have the complete query so we can immediately respond with
  // the data to initialise the application.
  // They do not yet have a sessionID as these are assigned on the server.
  // They cannot have mutations because we can't check for/cache responses
  // without a Session ID
  if (message.k === RequestKind.NEW_SESSION) {
    const query = message.q;
    const [sessionID, cache] = await Promise.all([
      getSessionID(sessionStore),
      withContext(context(), queryContext =>
        runQuery(query, {schema, logging, context: queryContext}),
      ),
    ]);
    return sessionStore.tx<ServerResponse>(sessionID, async session => {
      const version = cuid() as SessionVersion;
      return {
        session: {
          versions: [
            {
              version,
              query,
              cache,
            },
          ],
          mutations: {},
        },
        result: createNewSessionResponse(sessionID, version, cache),
      };
    });
  }

  const sessionID = message.s;
  return sessionStore.tx<ServerResponse>(sessionID, async session => {
    // Once we have a session ID, we can run mutations, even if the
    // session has expired, because we will be able to "restore" the
    // session with those mutations already recorded.
    // We assume that getting a request from the client means that all
    // existing mutation results (not in this request) have been processed,
    // so we discard the old cache of mutation results and replace it with
    // the new one.

    const mutations: {[key: string]: MutationResult<any>} = {};
    const mutationResults: MutationResult<any>[] = [];
    if (message.m && message.m.length) {
      const m = message.m;
      await withContext((mutationContext || context)(), async context => {
        for (let i = 0; i < m.length; i++) {
          const result =
            (session && session.mutations[m[i].i]) ||
            (await runMutation(
              {method: m[i].m, args: m[i].a},
              {schema, logging, context},
            ));
          mutations[m[i].i] = result;
          mutationResults.push(result);
        }
      });
    }
    if (!session) {
      return {
        session: {
          versions: [],
          mutations,
        },
        result: createExpiredSessionResponse(mutationResults),
      };
    }
    if (message.k === RequestKind.RESTORE_SESSION) {
      const cache = await withContext(context(), queryContext =>
        runQuery(query, {schema, logging, context: queryContext}),
      );
      const version = cuid() as SessionVersion;
      return {
        session: {
          versions: [
            {
              version,
              query: message.q,
              cache,
            },
          ],
          mutations,
        },
        result: createRestoreResponse(version, cache, mutationResults),
      };
    }
    const states = session.versions.filter(v => v.version === message.v);
    if (!states.length) {
      return {
        session: {
          versions: session.versions,
          mutations,
        },
        result: createExpiredSessionResponse(mutationResults),
      };
    }
    const state = states[0];

    const query = message.q
      ? mergeQueries(state.query, message.q)
      : state.query;
    const cache = await withContext(context(), queryContext =>
      runQuery(query, {schema, logging, context: queryContext}),
    );

    const versions = session.versions.filter(s => s.version >= message.v);

    const cacheUpdate = diffCache(state.cache, cache);
    let version = message.v;
    if (cacheUpdate || message.q) {
      version = cuid() as SessionVersion;
      versions.push({version, query, cache});
    }
    return {
      session: {
        versions,
        mutations,
      },
      result: createUpdateResponse(version, cacheUpdate, mutationResults),
    };
  });
}
