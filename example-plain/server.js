'use strict';

import fs from 'fs';
import express from 'express';
import browserify from 'browserify-middleware';
import React from 'react';
import stringify from 'js-stringify';
import Root from './containers/Root';
import MemoryHistory from 'react-router/lib/MemoryHistory';
import createStore from './store';

const store = createStore();

const app = express();

const indexHtml = fs.readFileSync(__dirname + '/index.html', 'utf8');

app.get('/static/bundle.js', browserify(
  __dirname + '/client.js',
  { transform: [require('babelify')] }
));
app.use(function (req, res, next) {
  if (req.path === '/favicon.ico') return next();
  let store = createStore();
  let element = <Root history={new MemoryHistory([req.url])} store={store} />;
  store.renderToString(React, element).done(function (html) {
    res.send(indexHtml.replace(/\{\{([a-z]*)\}\}/g, function (_, name) {
      if (name === 'content') return html;
      if (name === 'state') return stringify(store.getState());
      return _;
    }));
  }, next);
});
app.listen(3000, function (err) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at localhost:3000');
});
