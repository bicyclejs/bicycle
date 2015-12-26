import fs from 'fs';
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
import {createMiddleware} from '../src/node-store/server';
import MemoryStore from '../src/node-store/sessions/memory';
import schema from './schema';

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
app.use('/bicycle', createMiddleware(schema, sessionStore, req => ({user: req.user})));

app.listen(3000);
