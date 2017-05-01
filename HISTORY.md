# Changelog

## v1.0.0: 2017-05-01

 - Replace server side API with something a bit more Object Orientated. You now construct a `BicycleServer` api.  There is no longer a separate `loadSchema` function.  This saves repeatedly needing to pass `schem` to everything.
 - Add the ability to log at the beginning and end of queries and mutations. It will also pause to wait for any promises returned by the logging functions, which allows you to use them for cache invalidation.
