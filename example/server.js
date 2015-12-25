import fs from 'fs';
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';
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

app.use('/bicycle', schema);

app.listen(3000);
