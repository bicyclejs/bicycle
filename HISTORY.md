# Changelog

## v3.0.0: 2017-08-03

Convert to typescript

### Breaking:

 - Scalars `validate` method now has to return a boolean indicating whether the value is valid, and requires a "baseType".
 - Scalars can no longer have `parse` and `validate`.
 - The cache format, used by optimistic updaters, is now `{[typeName: string]: {[id: string]: Node}}` where it used to be `{[typeName + ':' + id]: Node}`. This is to allow for strongly typed bicycle caches.
 - Void and Null are now treated as different, distinct values.
 - The empty object is no longer cast to undefined for mutation arguments
 - `createServerRenderer` now expects a `getContext` argument and then takes `Request` instead of `Context`

 ### Features:

 - You can optionally add an `auth` property to each mutation/field. It is called with the same arguments as `resolve` and returns `true`, `false` (or a Promise for `true` or `false`) to idicate whether the current context is authorized to perform that action.
 - Args do not have to be objects, you an direclty use e.g. `number` now.

## v1.0.0: 2017-05-01

 - Replace server side API with something a bit more Object Orientated. You now construct a `BicycleServer` api.  There is no longer a separate `loadSchema` function.  This saves repeatedly needing to pass `schem` to everything.
 - Add the ability to log at the beginning and end of queries and mutations. It will also pause to wait for any promises returned by the logging functions, which allows you to use them for cache invalidation.