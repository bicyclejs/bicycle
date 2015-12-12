import 'babel-core/polyfill';
import React from 'react';
import BrowserHistory from 'react-router/lib/BrowserHistory';
import Root from './containers/Root';
import createStore from './store';

const store = createStore(INITIAL_STATE);

React.render(
  <Root history={new BrowserHistory()} store={store} />,
  document.getElementById('root')
);
