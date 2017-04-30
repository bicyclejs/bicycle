If you are attempting to diagnose a slow bicycle query, you can run node with a `--monitor-bicycle-performance` argument, and bicycle will log the total time spent resolving each field.

If you enable this flag, bicycle forces fields to be resolved one at a time, rather than in parallel, so you should be aware that this will make queries **much** slower.
