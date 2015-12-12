

### 1. Ensure "store" is passed in as a property to the root component

`history` is also passed in as a property, this was already the case so is not marked as a diff.

**N.B.** We are also including an INITIAL_STATE variable here, which we will populate later.

/containers/Root.js

```diff
  import React, { Component } from 'react';
  import { Provider } from 'react-redux';
  import { Router, Route } from 'react-router';
- import configureStore from '../store/configureStore';
  import App from './App';
  import UserPage from './UserPage';
  import RepoPage from './RepoPage';

- const store = configureStore();

  export default class Root extends Component {
    render() {
      return (
        <div>
-         <Provider store={store}>
+         <Provider store={this.props.store}>
            {() =>
              <Router history={this.props.history}>
                <Route path='/' component={App}>
                  <Route path='/:login/:name'
                         component={RepoPage} />
                  <Route path='/:login'
                         component={UserPage} />
                </Route>
              </Router>
            }
          </Provider>
        </div>
      );
    }
  }
```

/client.js

```diff
  import 'babel-core/polyfill';
  import React from 'react';
  import BrowserHistory from 'react-router/lib/BrowserHistory';
  import Root from './containers/Root';
+ import createStore from './store';

+ const store = createStore(INITIAL_STATE);

  React.render(
-   <Root history={new BrowserHistory()} />,
+   <Root history={new BrowserHistory()} store={store} />,
    document.getElementById('root')
);
```

### 2. Ensure in-flight requests are not duplicated

The code already ensured that when data was already loaded, it was not re-requested.  Unfortunately,
it made a request for data on every `componentWillMount` call, even if the data had already been requested
(but not loaded).  This change keeps track of currently in-progress requests and skips the action if a request
is already in flight.

**N.B.** This asynchronous middleware returns a promise that is picked up by redux-wait.

/middleware/api.js

```diff
  import { Schema, arrayOf, normalize } from 'normalizr';
  import { camelizeKeys } from 'humps';
  import 'isomorphic-fetch';

+ let inFlightRequests = {};

...


  /**
   * A Redux middleware that interprets actions with CALL_API info specified.
   * Performs the call and promises when such actions are dispatched.
   */
  export default store => next => action => {
    const callAPI = action[CALL_API];
    if (typeof callAPI === 'undefined') {
      return next(action);
    }

    let { endpoint } = callAPI;
    const { schema, types, bailout } = callAPI;

    if (typeof endpoint === 'function') {
      endpoint = endpoint(store.getState());
    }

...

+   if (inFlightRequests[endpoint]) {
+     return Promise.resolve();
+   }
+  inFlightRequests[endpoint] = true;

    const [requestType, successType, failureType] = types;
    next(actionWith({ type: requestType }));

    return callApi(endpoint, schema).then(
      response => {
        next(actionWith({
          response,
          type: successType
        }))
+       delete inFlightRequests[endpoint];
      },
      error => {
        next(actionWith({
          type: failureType,
          error: error.message || 'Something bad happened'
        }))
+       delete inFlightRequests[endpoint];
+       // on the server side, respond with 500 when an error happens
+       throw new Error(error.message || 'Something bad happened');
      }
    );
  };
```

### 3. Add method to store to support async rendering

Replacing the build in `applyMiddleware` from `redux` with the `applyMiddleware` from `redux-wait` adds an additional `.renderToString` method to the store, which we will make use of later.

**N.B.** if you use redux-thunk instead of promises for async it will break server side rendering.  It can be used for conditional actions though (which is what it is used for in this project).

/store/index.js

```diff
- import { createStore, combineReducers, applyMiddleware } from 'redux';
+ import { createStore, combineReducers } from 'redux';
+ import applyMiddleware from 'redux-wait';
  import thunkMiddleware from 'redux-thunk';
  import apiMiddleware from '../middleware/api';
  import loggerMiddleware from 'redux-logger';
  import * as reducers from '../reducers';

  const reducer = combineReducers(reducers);
  const createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware,
    apiMiddleware,
    loggerMiddleware
  )(createStore);

  /**
   * Creates a preconfigured store for this example.
   */
  export default function configureStore(initialState) {
    return createStoreWithMiddleware(reducer, initialState);
  }
```

### 4. Add placeholders for "content" and "initial state" in the HTML template

/index.html

```diff
  <html>
    <head>
      <title>Redux real-world example</title>
    </head>
    <body>
-     <div id="root"></div>
+     <div id="root">{{content}}</div>
+     <script>var INITIAL_STATE = {{state}};</script>
      <script src="/static/bundle.js"></script>
    </body>
  </html>
```

### 5. Render the app server side

`store.renderToString` is added by `redux-wait`.  It returns a promise for the string representation of
an element, but waits until there are no more pending actions before resolving.

/server.js

```diff
  'use strict';

+ import fs from 'fs';
  import express from 'express';
  import browserify from 'browserify-middleware';
  import React from 'react';
+ import stringify from 'js-stringify';
+ import Root from './containers/Root';
+ import MemoryHistory from 'react-router/lib/MemoryHistory';
+ import createStore from './store';

+ const store = createStore();

  const app = express();

+ const indexHtml = fs.readFileSync(__dirname + '/index.html', 'utf8');

  app.get('/static/bundle.js', browserify(
    __dirname + '/client.js',
    { transform: [require('babelify')] }
  ));
  app.use(function (req, res, next) {
    if (req.path === '/favicon.ico') return next();
-   res.sendFile(__dirname + '/index.html');
+   let store = createStore();
+   let element = <Root history={new MemoryHistory([req.url])} store={store} />;
+   store.renderToString(React, element).done(function (html) {
+     res.send(indexHtml.replace(/\{\{([a-z]*)\}\}/g, function (_, name) {
+       if (name === 'content') return html;
+       if (name === 'state') return stringify(store.getState());
+       return _;
+     }));
+   }, next);
  });
  app.listen(3000, function (err) {
    if (err) {
      console.log(err);
    }

    console.log('Listening at localhost:3000');
  });
```
