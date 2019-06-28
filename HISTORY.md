# Changelog

## v9.1.2: 2019-06-28

 - Fix `onRequestStart` and `onRequestEnd` were not being triggered when request used default middleware

## v9.1.1: 2019-06-28

- Add `onRequestStart` and `onRequestEnd` events to help with certain logging scenarios.
- Add `getActiveSessionCount` and `getMaxSessionCount` methods to allow inspecting how full the session store is.

## v9.0.0: 2019-02-06

- BREAKING CHANGE: makes use of the new `unknown` type in TypeScript. If you're using TypeScript, you must be on at least version 3 to use this version of Bicycle.

## v8.2.0: 2019-02-06

- Add `server.getNetworkLayer` API that allows you to get a network layer that can be passed directly to the client, for use when the client and server are actually both running in the same node.js process.

## v8.1.1: 2018-08-29

- Support configuring memory cache size via `sessionStoreSize` or setting the `BICYCLE_SESSION_STORE_SIZE` environment variable. It still defaults to 100.

## v8.0.0: 2018-07-05

- Use new opaque types module and fix handling of opaque types on latest version of typescipt
- Breaking Change: You now have to explicitly use `unsafeCast` and `extract` methods to cast too and from opaque types if you use them within your application.

## v7.0.2: 2018-01-29

- Fix bug that prevented a session being restored

## v7.0.1: 2018-01-29

- Improve error message for `set` mutations using un-typed schemas

## v7.0.0: 2018-01-26

- BREAKING: Change the protocol used on the wire
- BREAKING: Change the store API
- Fix issue where a failed network response could lead to clients getting out of sync.

## v6.0.0: 2018-01-05

- BREAKING: Take all client options as part of the object
- Automatically detect `BICYCLE_SERVER_PREPARATION` as a global variable if set.

## v5.0.0: 2017-12-26

- Pass the `res` as the second argument to `getContext` functions. This makes it
  simpler to handle session state (login, logout etc.) as part of a bicycle
  request.
- Remove the `dispose` method from context objects.
- Add a new "function" approach for transactions in sessions. To use:

```js
function getContext(req, res) {
  return async fn => {
    const ctx = new Context();
    try {
      return await fn();
    } finally {
      ctx.dispose();
    }
  };
}
```

## v4.5.0: 2017-12-05

- Only show timing to the nearest millisecond, but still use nanoseconds in the
  background
- Add an optimisation that helps avoid querying the same data twice

## v4.4.0: 2017-12-04

- Time to the nanosecond when `--monitor-bicycle-performance` is passed

## v4.3.0: 2017-11-12

- Pass `fieldName` as part of query context for `resolve` field methods.

## v4.2.2: 2017-11-11

- Fix `isCached` which sometimes incorrectly reported values as being cached,
  leading to them never loading.

## v4.2.1: 2017-11-11

- Cast `undefined` fields to `null`. We use `undefined` to represent "not yet
  loaded".

## v4.2.0: 2017-10-23

- Expose `QueryCacheResult` interface on `client` module

## v4.1.0: 2017-10-20

- Inspect queries when an invalid query happens in merge in development.

## v4.0.1: 2017-10-03

- Fix broken publish

## v4.0.0: 2017-08-05

- Optimistic values are now strings. They still get replaced once the true
  values are discovered.
- Optimistic handlers are now given a mutable Cache Object. This means they
  always have the same API wheather they are typed (using ts-bicycle) or not.

## v3.1.5: 2017-08-05

- Fix broken queries (I forgot to run the tests)

## v3.1.4: 2017-08-05

- Fix server side rendering with typescript

## v3.1.3: 2017-08-04

- Fix one broken overload of server renderer

## v3.1.2: 2017-08-04

- All server methods can have getContext return a Promise for context, as well
  as returning the context directly. This lets you setup database connections
  asynchronously, before returning a context.

## v3.1.1: 2017-08-04

- Moved some of the typed helpers and added some new ones

## v3.1.0: 2017-08-04

- Pass context to ID getter
- Add helpers for typed code

## v3.0.1: 2017-08-03

- Preserve const enums for non typescript consumers

## v3.0.0: 2017-08-03

Convert to typescript

### Breaking:

- Scalars `validate` method now has to return a boolean indicating whether the
  value is valid, and requires a "baseType".
- Scalars can no longer have `parse` and `validate`.
- The cache format, used by optimistic updaters, is now `{[typeName: string]: {[id: string]: Node}}` where it used to be `{[typeName + ':' + id]: Node}`.
  This is to allow for strongly typed bicycle caches.
- Void and Null are now treated as different, distinct values.
- The empty object is no longer cast to undefined for mutation arguments
- `createServerRenderer` now expects a `getContext` argument and then takes
  `Request` instead of `Context`

### Features:

- You can optionally add an `auth` property to each mutation/field. It is called
  with the same arguments as `resolve` and returns `true`, `false` (or a Promise
  for `true` or `false`) to idicate whether the current context is authorized to
  perform that action.
- Args do not have to be objects, you an direclty use e.g. `number` now.

## v1.0.0: 2017-05-01

- Replace server side API with something a bit more Object Orientated. You now
  construct a `BicycleServer` api. There is no longer a separate `loadSchema`
  function. This saves repeatedly needing to pass `schem` to everything.
- Add the ability to log at the beginning and end of queries and mutations. It
  will also pause to wait for any promises returned by the logging functions,
  which allows you to use them for cache invalidation.
