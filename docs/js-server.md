---
id: js-server
title: BicycleServer
sidebar_label: Server
---

If you have a schema defined as JavaScript files in the recommended structure, you can construct a bicycle server instance like:

```js
import BicycleServer from 'bicycle/server';

const options = {};

const bicycle = new BicycleServer(__dirname + '/bicycle-schema', options);
```

Bicycle will automatically require the js files for you. If you prefer, you can explicitly import them and pass them to BicycleServer

```js
import BicycleServer from 'bicycle/server';
import Root from './bicycle-schema/objects/Root';
import Todo from './bicycle-schema/objects/Todo';
import id from './bicycle-schema/scalars/id';

const options = {};

const bicycle = new BicycleServer({
  objects: [Root, Todo],
  scalars: [id],
}, options);
```

## options

<!-- tsdoc:start ./server#Options -->

<table class="interface-table"><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td><pre><code>disableDefaultLogging</code></pre></td><td><pre><code class="lang-ts">boolean</code></pre></td><td><p>silence error logging</p><p><b>@default</b> false</p>
</td></tr>
<tr><td><pre><code>onError</code></pre></td><td><pre><code class="lang-ts">(e: {error: Error}) => any</code></pre></td><td><p>Event triggered when an error is thrown by a mutaiton or query resolver</p><p><b>@default</b> no-op</p>
</td></tr>
<tr><td><pre><code>onMutationEnd</code></pre></td><td><pre><code class="lang-ts">(
  e: {
    mutation: {
      readonly method: string;
      readonly args: Object;
    };
    result: MutationResult<any>;
  },
) => any</code></pre></td><td><p>Event triggered when a mutation ends</p><p><b>@default</b> no-op</p>
</td></tr>
<tr><td><pre><code>onMutationStart</code></pre></td><td><pre><code class="lang-ts">(
  e: {
    mutation: {
      readonly method: string;
      readonly args: Object;
    };
  },
) => any</code></pre></td><td><p>Event triggered when a mutation starts</p><p><b>@default</b> no-op</p>
</td></tr>
<tr><td><pre><code>onQueryEnd</code></pre></td><td><pre><code class="lang-ts">(
  e: {
    query: Object;
    cacheResult: Object;
  },
) => any</code></pre></td><td><p>Event triggered when a query ends</p><p><b>@default</b> no-op</p>
</td></tr>
<tr><td><pre><code>onQueryStart</code></pre></td><td><pre><code class="lang-ts">(e: {query: Object}) => any</code></pre></td><td><p>Event triggered when a query starts</p><p><b>@default</b> no-op</p>
</td></tr>
<tr><td><pre><code>sessionStore</code></pre></td><td><pre><code class="lang-ts">SessionStore</code></pre></td><td><p>a custom session store</p><p><b>@default</b> MemorySessionStore</p>
</td></tr>
<tr><td><pre><code>sessionStoreSize</code></pre></td><td><pre><code class="lang-ts">number</code></pre></td><td><p>The maximum number of active sessions.</p><p>You can also set via the <code>BICYCLE_SESSION_STORE_SIZE</code> environment variable.</p><p><b>@defualt</b> 100</p>
</td></tr>
</tbody></table>

<!-- tsdoc:end -->

## `createMiddleware`

Once you have a schema, you can expose it on a path using `createMiddleware`.  By default this responds to
messages sent as a JSON body in an http POST.  Conveniently, this is what the default `NetworkLayer` implementation
does too.

```js
import express from 'express';

const app = express();

app.use('/bicycle', bicycle.createMiddleware(req => ({user: req.user})));

app.listen(process.env.PORT || 3000);
```

I recommend serving it on the path `/bicycle` as this is the default, but you can pass options to `NetworkLayer`, when constructing the client to
select a different path if you want.

### args

 - getContext - A function that takes a request and returns the "context" object used for queries and mutations

## `createServerRenderer`

If you want your application to render on the server side (e.g. for users without JavaScript enabled) you can use
`createServerRenderer`

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

const serverRenderer = bicycle.createServerRenderer((client, ...args) => {
  // you can render your app here, querying from "client"
  // your app will be rendered multiple times until all the data has been loaded
  // only `client.queryCache` is implemented.
  const {result, loaded, errors} = client.queryCache({{todos: {id: true, title: true, completed: true}}});
  if (loaded && !errors.length) {
    return renderTemplate(result);
  }
});

// the first argument is the "context", subsequent arguments are passed through to your rendering function.
serverRenderer({user: 'my user'}, ...args).done(({serverPreparation, result}) => {
  console.log('server renderer result:');
  console.log(result);
  // serverPreparation can be used to rehydrate the data on the client
});
```

## `runQuery`

If you need to run a query on the server side, you can directly call `runQuery`.  You will need to pass it a context.

```js
const result = await bicycle.runQuery({
  todos: {id: true, title: true, completed: true},
}, context)
console.log(result.todos);
```

## `runMutation`

If you need to run a mutation on the server side, you can directly call `runMutation`.  You will need to pass it a context.

```js
await bicycle.runMutation('Todo.toggle', {id, checked: true}, context);
console.log('Todo complete');
```

## `handleMessage`

If you've replaced the network layer with a custom network layer (only for really advanced use cases) you can use
`handleMessage` instead of `createBicycleMiddleware`.

```js
import BicycleServer from 'bicycle/server';

const schema = __dirname + '/schema';
const options = {};
const bicycle = new BicycleServer(schema, options);

class MockNetworkLayer {
  constructor(bicycle, context) {
    this._bicycle = bicycle;
    this._context = context;
  }
  send(message) {
    return this._bicycle.handleMessage(message, this._context);
  }
}
```
