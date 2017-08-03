import fs from 'fs';
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
import BicycleServer from '../lib/server';

const bicycle = new BicycleServer(__dirname + '/schema');

const app = express();

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/index.html');
});

const baseCss = fs.readFileSync(require.resolve('todomvc-common/base.css'));
const appCss = fs.readFileSync(require.resolve('todomvc-app-css/index.css'));
app.get('/style.css', (req, res, next) => {
  res.type('css');
  res.send(baseCss + '\n' + appCss);
});

app.get('/client.js', browserify(__dirname + '/client/index.js', {transform: [babelify]}));

app.use('/bicycle', bicycle.createMiddleware(req => ({user: req.user})));

// TODO: use this capability to actually do server side rendering
const serverRenderer = bicycle.createServerRenderer(req => ({user: 'my user'}), (client, req, ...args) => {
  return client.queryCache({todos: {id: true, title: true, completed: true}}).result;
});
const fakeRequest = {};
serverRenderer(fakeRequest).then(result => {
  console.log('server renderer result');
  console.dir(result, {depth: 10, colors: true});
});

app.listen(3000);
