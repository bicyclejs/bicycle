import fs from 'fs';
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
import {createBicycleMiddleware, createServerRenderer, loadSchemaFromFiles} from '../src';
import MemoryStore from '../src/sessions/memory';

const schema = loadSchemaFromFiles(__dirname + '/schema');

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

const sessionStore = new MemoryStore();
app.use('/bicycle', createBicycleMiddleware(schema, sessionStore, req => ({user: req.user})));

// TODO: use this capability to actually do server side rendering
const serverRenderer = createServerRenderer(
  schema,
  sessionStore,
  (client, ...args) => {
    return client.queryCache({todos: {id: true, title: true, completed: true}}).result;
  }
);
serverRenderer({user: 'my user'}).done(result => {
  console.log('server renderer result');
  console.dir(result, {depth: 10, colors: true});
});

app.listen(3000);
